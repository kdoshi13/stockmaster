import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all deliveries
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      d.*,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM deliveries d
    LEFT JOIN users u1 ON d.created_by = u1.id
    LEFT JOIN users u2 ON d.updated_by = u2.id
    ORDER BY d.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching deliveries:', err);
      return res.status(500).json({ message: 'Error fetching deliveries' });
    }
    res.json(rows);
  });
});

// Get delivery by ID with lines
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const deliverySql = `
    SELECT 
      d.*,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM deliveries d
    LEFT JOIN users u1 ON d.created_by = u1.id
    LEFT JOIN users u2 ON d.updated_by = u2.id
    WHERE d.id = ?
  `;
  
  db.get(deliverySql, [id], (err, delivery) => {
    if (err) {
      console.error('Error fetching delivery:', err);
      return res.status(500).json({ message: 'Error fetching delivery' });
    }
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    const linesSql = `
      SELECT 
        dl.*,
        p.name as product_name,
        p.id_code as product_code,
        l.name as location_name
      FROM delivery_lines dl
      LEFT JOIN products p ON dl.product_id = p.id
      LEFT JOIN locations l ON dl.location_id = l.id
      WHERE dl.delivery_id = ?
    `;
    
    db.all(linesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching delivery lines:', err);
        return res.status(500).json({ message: 'Error fetching delivery lines' });
      }
      res.json({ ...delivery, lines });
    });
  });
});

// Create new delivery
router.post('/', (req, res) => {
  const {
    ref,
    customer_name,
    note,
    created_by,
    lines = []
  } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const deliverySql = `
      INSERT INTO deliveries (ref, customer_name, status, created_by, created_at, note)
      VALUES (?, ?, 'draft', ?, datetime('now'), ?)
    `;
    
    db.run(deliverySql, [ref, customer_name, created_by, note], function(err) {
      if (err) {
        console.error('Error creating delivery:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error creating delivery' });
      }
      
      const deliveryId = this.lastID;
      
      if (lines.length === 0) {
        db.run('COMMIT');
        return res.status(201).json({
          message: 'Delivery created successfully',
          id: deliveryId
        });
      }
      
      const lineSql = `
        INSERT INTO delivery_lines (delivery_id, product_id, location_id, qty, note)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        db.run(lineSql, [
          deliveryId,
          line.product_id,
          line.location_id,
          line.qty,
          line.note
        ], (err) => {
          if (err) {
            console.error('Error creating delivery line:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error creating delivery lines' });
          }
          
          completed++;
          if (completed === totalLines) {
            db.run('COMMIT');
            res.status(201).json({
              message: 'Delivery created successfully',
              id: deliveryId
            });
          }
        });
      });
    });
  });
});

// Validate delivery (update stock)
router.put('/:id/validate', (req, res) => {
  const { id } = req.params;
  const { validated_by } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get delivery lines
    const getLinesSql = 'SELECT * FROM delivery_lines WHERE delivery_id = ?';
    
    db.all(getLinesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching delivery lines for validation:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error fetching delivery lines' });
      }
      
      if (lines.length === 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'No lines to validate' });
      }
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        // Check stock availability
        const checkStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
        db.get(checkStockSql, [line.product_id, line.location_id], (err, stock) => {
          if (err) {
            console.error('Error checking stock:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error checking stock' });
          }
          
          if (!stock || stock.qty < line.qty) {
            db.run('ROLLBACK');
            return res.status(400).json({ 
              message: `Insufficient stock for product ID ${line.product_id}` 
            });
          }
          
          // Update stock
          const updateStockSql = `
            UPDATE stock SET 
              qty = qty - ?,
              last_updated = datetime('now')
            WHERE product_id = ? AND location_id = ?
          `;
          
          db.run(updateStockSql, [line.qty, line.product_id, line.location_id], (err) => {
            if (err) {
              console.error('Error updating stock:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Error updating stock' });
            }
            
            const newBalance = stock.qty - line.qty;
            
            // Insert stock ledger entry
            const ledgerSql = `
              INSERT INTO stock_ledger (
                product_id, timestamp, user_id, type, ref_id,
                location_from, qty_change, balance_after, note
              ) VALUES (?, datetime('now'), ?, 'delivery', ?, ?, ?, ?, ?)
            `;
            
            db.run(ledgerSql, [
              line.product_id,
              validated_by,
              id,
              line.location_id,
              -line.qty,
              newBalance,
              'Delivery validation'
            ], (err) => {
              if (err) {
                console.error('Error inserting stock ledger:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error inserting stock ledger' });
              }
              
              completed++;
              if (completed === totalLines) {
                // Update delivery status
                const updateDeliverySql = `
                  UPDATE deliveries SET 
                    status = 'shipped',
                    shipped_at = datetime('now')
                  WHERE id = ?
                `;
                
                db.run(updateDeliverySql, [id], (err) => {
                  if (err) {
                    console.error('Error updating delivery status:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error updating delivery status' });
                  }
                  
                  db.run('COMMIT');
                  res.json({ message: 'Delivery validated and shipped successfully' });
                });
              }
            });
          });
        });
      });
    });
  });
});

export default router;
