import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all receipts
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      r.*,
      v.name as vendor_name,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    LEFT JOIN users u1 ON r.created_by = u1.id
    LEFT JOIN users u2 ON r.updated_by = u2.id
    ORDER BY r.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching receipts:', err);
      return res.status(500).json({ message: 'Error fetching receipts' });
    }
    res.json(rows);
  });
});

// Get receipt by ID with lines
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // Get receipt details
  const receiptSql = `
    SELECT 
      r.*,
      v.name as vendor_name,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM receipts r
    LEFT JOIN vendors v ON r.vendor_id = v.id
    LEFT JOIN users u1 ON r.created_by = u1.id
    LEFT JOIN users u2 ON r.updated_by = u2.id
    WHERE r.id = ?
  `;
  
  db.get(receiptSql, [id], (err, receipt) => {
    if (err) {
      console.error('Error fetching receipt:', err);
      return res.status(500).json({ message: 'Error fetching receipt' });
    }
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Get receipt lines
    const linesSql = `
      SELECT 
        rl.*,
        p.name as product_name,
        p.id_code as product_code,
        l.name as location_name
      FROM receipt_lines rl
      LEFT JOIN products p ON rl.product_id = p.id
      LEFT JOIN locations l ON rl.location_id = l.id
      WHERE rl.receipt_id = ?
    `;
    
    db.all(linesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching receipt lines:', err);
        return res.status(500).json({ message: 'Error fetching receipt lines' });
      }
      res.json({ ...receipt, lines });
    });
  });
});

// Create new receipt
router.post('/', (req, res) => {
  const {
    ref,
    vendor_id,
    note,
    created_by,
    lines = []
  } = req.body;

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Insert receipt
    const receiptSql = `
      INSERT INTO receipts (ref, vendor_id, status, created_by, created_at, note)
      VALUES (?, ?, 'draft', ?, datetime('now'), ?)
    `;
    
    db.run(receiptSql, [ref, vendor_id, created_by, note], function(err) {
      if (err) {
        console.error('Error creating receipt:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error creating receipt' });
      }
      
      const receiptId = this.lastID;
      
      // Insert receipt lines
      if (lines.length === 0) {
        db.run('COMMIT');
        return res.status(201).json({
          message: 'Receipt created successfully',
          id: receiptId
        });
      }
      
      const lineSql = `
        INSERT INTO receipt_lines (receipt_id, product_id, location_id, expected_qty, note)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line, index) => {
        db.run(lineSql, [
          receiptId,
          line.product_id,
          line.location_id,
          line.expected_qty,
          line.note
        ], (err) => {
          if (err) {
            console.error('Error creating receipt line:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error creating receipt lines' });
          }
          
          completed++;
          if (completed === totalLines) {
            db.run('COMMIT');
            res.status(201).json({
              message: 'Receipt created successfully',
              id: receiptId
            });
          }
        });
      });
    });
  });
});

// Validate receipt (convert expected_qty to received_qty)
router.put('/:id/validate', (req, res) => {
  const { id } = req.params;
  const { validated_by } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get receipt lines
    const getLinesSql = `
      SELECT * FROM receipt_lines WHERE receipt_id = ?
    `;
    
    db.all(getLinesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching receipt lines for validation:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error fetching receipt lines' });
      }
      
      if (lines.length === 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'No lines to validate' });
      }
      
      // Update stock and stock_ledger for each line
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        // Update or insert stock
        const updateStockSql = `
          UPDATE stock SET 
            qty = qty + ?,
            last_updated = datetime('now')
          WHERE product_id = ? AND location_id = ?
        `;
        
        db.run(updateStockSql, [line.expected_qty, line.product_id, line.location_id], function(err) {
          if (err) {
            console.error('Error updating stock:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error updating stock' });
          }
          
          if (this.changes === 0) {
            // Stock record doesn't exist, create it
            const insertStockSql = `
              INSERT INTO stock (product_id, location_id, qty, reserved, last_updated)
              VALUES (?, ?, ?, 0, datetime('now'))
            `;
            
            db.run(insertStockSql, [line.product_id, line.location_id, line.expected_qty], (err) => {
              if (err) {
                console.error('Error inserting stock:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error inserting stock' });
              }
              
              // Get current stock level
              const getCurrentStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
              db.get(getCurrentStockSql, [line.product_id, line.location_id], (err, stock) => {
                if (err || !stock) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Error getting current stock' });
                }
                
                // Insert stock ledger entry
                const ledgerSql = `
                  INSERT INTO stock_ledger (
                    product_id, timestamp, user_id, type, ref_id,
                    location_to, qty_change, balance_after, note
                  ) VALUES (?, datetime('now'), ?, 'receipt', ?, ?, ?, ?, ?)
                `;
                
                db.run(ledgerSql, [
                  line.product_id,
                  validated_by,
                  id,
                  line.location_id,
                  line.expected_qty,
                  stock.qty,
                  'Receipt validation'
                ], (err) => {
                  if (err) {
                    console.error('Error inserting stock ledger:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error inserting stock ledger' });
                  }
                  
                  completed++;
                  if (completed === totalLines) {
                    // Update receipt status
                    const updateReceiptSql = `
                      UPDATE receipts SET 
                        status = 'validated',
                        validated_by = ?,
                        validated_at = datetime('now')
                      WHERE id = ?
                    `;
                    
                    db.run(updateReceiptSql, [validated_by, id], (err) => {
                      if (err) {
                        console.error('Error updating receipt status:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ message: 'Error updating receipt status' });
                      }
                      
                      db.run('COMMIT');
                      res.json({ message: 'Receipt validated successfully' });
                    });
                  }
                });
              });
            });
          } else {
            // Stock record exists, get current qty
            const getCurrentStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
            db.get(getCurrentStockSql, [line.product_id, line.location_id], (err, stock) => {
              if (err || !stock) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error getting current stock' });
              }
              
              const newBalance = stock.qty + line.expected_qty;
              
              // Insert stock ledger entry
              const ledgerSql = `
                INSERT INTO stock_ledger (
                  product_id, timestamp, user_id, type, ref_id,
                  location_to, qty_change, balance_after, note
                ) VALUES (?, datetime('now'), ?, 'receipt', ?, ?, ?, ?, ?)
              `;
              
              db.run(ledgerSql, [
                line.product_id,
                validated_by,
                id,
                line.location_id,
                line.expected_qty,
                newBalance,
                'Receipt validation'
              ], (err) => {
                if (err) {
                  console.error('Error inserting stock ledger:', err);
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Error inserting stock ledger' });
                }
                
                completed++;
                if (completed === totalLines) {
                  // Update receipt status
                  const updateReceiptSql = `
                    UPDATE receipts SET 
                      status = 'validated',
                      validated_by = ?,
                      validated_at = datetime('now')
                    WHERE id = ?
                  `;
                  
                  db.run(updateReceiptSql, [validated_by, id], (err) => {
                    if (err) {
                      console.error('Error updating receipt status:', err);
                      db.run('ROLLBACK');
                      return res.status(500).json({ message: 'Error updating receipt status' });
                    }
                    
                    db.run('COMMIT');
                    res.json({ message: 'Receipt validated successfully' });
                  });
                }
              });
            });
          }
        });
      });
    });
  });
});

export default router;
