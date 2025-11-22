import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all transfers
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      t.*,
      l_from.name as from_location_name,
      l_to.name as to_location_name,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM transfers t
    LEFT JOIN locations l_from ON t.from_location_id = l_from.id
    LEFT JOIN locations l_to ON t.to_location_id = l_to.id
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.updated_by = u2.id
    ORDER BY t.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching transfers:', err);
      return res.status(500).json({ message: 'Error fetching transfers' });
    }
    res.json(rows);
  });
});

// Get transfer by ID with lines
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const transferSql = `
    SELECT 
      t.*,
      l_from.name as from_location_name,
      l_to.name as to_location_name,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM transfers t
    LEFT JOIN locations l_from ON t.from_location_id = l_from.id
    LEFT JOIN locations l_to ON t.to_location_id = l_to.id
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.updated_by = u2.id
    WHERE t.id = ?
  `;
  
  db.get(transferSql, [id], (err, transfer) => {
    if (err) {
      console.error('Error fetching transfer:', err);
      return res.status(500).json({ message: 'Error fetching transfer' });
    }
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    
    const linesSql = `
      SELECT 
        tl.*,
        p.name as product_name,
        p.id_code as product_code
      FROM transfer_lines tl
      LEFT JOIN products p ON tl.product_id = p.id
      WHERE tl.transfer_id = ?
    `;
    
    db.all(linesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching transfer lines:', err);
        return res.status(500).json({ message: 'Error fetching transfer lines' });
      }
      res.json({ ...transfer, lines });
    });
  });
});

// Create new transfer
router.post('/', (req, res) => {
  const {
    ref,
    from_location_id,
    to_location_id,
    note,
    created_by,
    lines = []
  } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const transferSql = `
      INSERT INTO transfers (
        ref, from_location_id, to_location_id, status, created_by, created_at, note
      ) VALUES (?, ?, ?, 'draft', ?, datetime('now'), ?)
    `;
    
    db.run(transferSql, [ref, from_location_id, to_location_id, created_by, note], function(err) {
      if (err) {
        console.error('Error creating transfer:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error creating transfer' });
      }
      
      const transferId = this.lastID;
      
      if (lines.length === 0) {
        db.run('COMMIT');
        return res.status(201).json({
          message: 'Transfer created successfully',
          id: transferId
        });
      }
      
      const lineSql = `
        INSERT INTO transfer_lines (transfer_id, product_id, qty, note)
        VALUES (?, ?, ?, ?)
      `;
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        db.run(lineSql, [
          transferId,
          line.product_id,
          line.qty,
          line.note
        ], (err) => {
          if (err) {
            console.error('Error creating transfer line:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error creating transfer lines' });
          }
          
          completed++;
          if (completed === totalLines) {
            db.run('COMMIT');
            res.status(201).json({
              message: 'Transfer created successfully',
              id: transferId
            });
          }
        });
      });
    });
  });
});

// Validate transfer (execute the transfer)
router.put('/:id/validate', (req, res) => {
  const { id } = req.params;
  const { validated_by } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get transfer details
    const getTransferSql = 'SELECT * FROM transfers WHERE id = ?';
    db.get(getTransferSql, [id], (err, transfer) => {
      if (err) {
        console.error('Error fetching transfer for validation:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error fetching transfer' });
      }
      
      if (!transfer) {
        db.run('ROLLBACK');
        return res.status(404).json({ message: 'Transfer not found' });
      }
      
      // Get transfer lines
      const getLinesSql = 'SELECT * FROM transfer_lines WHERE transfer_id = ?';
      db.all(getLinesSql, [id], (err, lines) => {
        if (err) {
          console.error('Error fetching transfer lines for validation:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error fetching transfer lines' });
        }
        
        if (lines.length === 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ message: 'No lines to validate' });
        }
        
        let completed = 0;
        const totalLines = lines.length;
        
        lines.forEach((line) => {
          // Check stock availability at from_location
          const checkStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
          db.get(checkStockSql, [line.product_id, transfer.from_location_id], (err, stock) => {
            if (err) {
              console.error('Error checking stock:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error checking stock' });
            }
            
            if (!stock || stock.qty < line.qty) {
              db.run('ROLLBACK');
              return res.status(400).json({ 
                message: `Insufficient stock for product ID ${line.product_id} at source location` 
              });
            }
            
            const fromBalance = stock.qty - line.qty;
            
            // Update stock at from_location (deduct)
            const updateFromStockSql = `
              UPDATE stock SET 
                qty = qty - ?,
                last_updated = datetime('now')
              WHERE product_id = ? AND location_id = ?
            `;
            
            db.run(updateFromStockSql, [line.qty, line.product_id, transfer.from_location_id], (err) => {
              if (err) {
                console.error('Error updating from stock:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error updating from stock' });
              }
              
              // Entry for deduction from from_location
              const fromLedgerSql = `
                INSERT INTO stock_ledger (
                  product_id, timestamp, user_id, type, ref_id,
                  location_from, qty_change, balance_after, note
                ) VALUES (?, datetime('now'), ?, 'transfer', ?, ?, ?, ?, ?)
              `;
              
              db.run(fromLedgerSql, [
                line.product_id,
                validated_by,
                id,
                transfer.from_location_id,
                -line.qty,
                fromBalance,
                `Transfer to ${transfer.to_location_id}`
              ], (err) => {
                if (err) {
                  console.error('Error inserting from ledger:', err);
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Error inserting from ledger' });
                }
                
                // Update or insert stock at to_location (add)
                const updateToStockSql = `
                  UPDATE stock SET 
                    qty = qty + ?,
                    last_updated = datetime('now')
                  WHERE product_id = ? AND location_id = ?
                `;
                
                db.run(updateToStockSql, [line.qty, line.product_id, transfer.to_location_id], (err) => {
                  if (err) {
                    console.error('Error updating to stock:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error updating to stock' });
                  }
                  
                  if (this.changes === 0) {
                    // Stock record doesn't exist at to_location, create it
                    const insertToStockSql = `
                      INSERT INTO stock (product_id, location_id, qty, reserved, last_updated)
                      VALUES (?, ?, ?, 0, datetime('now'))
                    `;
                    
                    db.run(insertToStockSql, [line.product_id, transfer.to_location_id, line.qty], (err) => {
                      if (err) {
                        console.error('Error inserting to stock:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Error inserting to stock' });
                      }
                      finalizeTransfer();
                    });
                  } else {
                    finalizeTransfer();
                  }
                });
              });
            });
          });
        });
        
        function finalizeTransfer() {
          // Get current stock at to_location for balance
          const getToStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
          db.get(getToStockSql, [line.product_id, transfer.to_location_id], (err, toStock) => {
            if (err || !toStock) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error getting to stock' });
            }
            
            const toBalance = toStock.qty;
            
            // Entry for addition to to_location
            const toLedgerSql = `
              INSERT INTO stock_ledger (
                product_id, timestamp, user_id, type, ref_id,
                location_to, qty_change, balance_after, note
              ) VALUES (?, datetime('now'), ?, 'transfer', ?, ?, ?, ?, ?)
            `;
            
            db.run(toLedgerSql, [
              line.product_id,
              validated_by,
              id,
              transfer.to_location_id,
              line.qty,
              toBalance,
              `Transfer from ${transfer.from_location_id}`
            ], (err) => {
              if (err) {
                console.error('Error inserting to ledger:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error inserting to ledger' });
              }
              
              completed++;
              if (completed === totalLines) {
                // Update transfer status
                const updateTransferSql = `
                  UPDATE transfers SET 
                    status = 'completed',
                    completed_at = datetime('now')
                  WHERE id = ?
                `;
                
                db.run(updateTransferSql, [id], (err) => {
                  if (err) {
                    console.error('Error updating transfer status:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error updating transfer status' });
                  }
                  
                  db.run('COMMIT');
                  res.json({ message: 'Transfer validated and completed successfully' });
                });
              }
            });
          });
        }
      });
    });
  });
});

export default router;
