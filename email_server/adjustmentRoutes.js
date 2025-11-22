import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all adjustments
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      a.*,
      u1.name as created_by_name,
      u2.name as validated_by_name
    FROM adjustments a
    LEFT JOIN users u1 ON a.created_by = u1.id
    LEFT JOIN users u2 ON a.validated_by = u2.id
    ORDER BY a.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching adjustments:', err);
      return res.status(500).json({ message: 'Error fetching adjustments' });
    }
    res.json(rows);
  });
});

// Get adjustment by ID with lines
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const adjustmentSql = `
    SELECT 
      a.*,
      u1.name as created_by_name,
      u2.name as validated_by_name
    FROM adjustments a
    LEFT JOIN users u1 ON a.created_by = u1.id
    LEFT JOIN users u2 ON a.validated_by = u2.id
    WHERE a.id = ?
  `;
  
  db.get(adjustmentSql, [id], (err, adjustment) => {
    if (err) {
      console.error('Error fetching adjustment:', err);
      return res.status(500).json({ message: 'Error fetching adjustment' });
    }
    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }
    
    const linesSql = `
      SELECT 
        al.*,
        p.name as product_name,
        p.id_code as product_code,
        l.name as location_name,
        s.qty as current_stock
      FROM adjustment_lines al
      LEFT JOIN products p ON al.product_id = p.id
      LEFT JOIN locations l ON al.location_id = l.id
      LEFT JOIN stock s ON al.product_id = s.product_id AND al.location_id = s.location_id
      WHERE al.adjustment_id = ?
    `;
    
    db.all(linesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching adjustment lines:', err);
        return res.status(500).json({ message: 'Error fetching adjustment lines' });
      }
      res.json({ ...adjustment, lines });
    });
  });
});

// Create new adjustment
router.post('/', (req, res) => {
  const {
    ref,
    reason,
    note,
    created_by,
    lines = []
  } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const adjustmentSql = `
      INSERT INTO adjustments (ref, reason, status, created_by, created_at, note)
      VALUES (?, ?, 'draft', ?, datetime('now'), ?)
    `;
    
    db.run(adjustmentSql, [ref, reason, created_by, note], function(err) {
      if (err) {
        console.error('Error creating adjustment:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error creating adjustment' });
      }
      
      const adjustmentId = this.lastID;
      
      if (lines.length === 0) {
        db.run('COMMIT');
        return res.status(201).json({
          message: 'Adjustment created successfully',
          id: adjustmentId
        });
      }
      
      const lineSql = `
        INSERT INTO adjustment_lines (adjustment_id, product_id, location_id, counted_qty, note)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        db.run(lineSql, [
          adjustmentId,
          line.product_id,
          line.location_id,
          line.counted_qty,
          line.note
        ], (err) => {
          if (err) {
            console.error('Error creating adjustment line:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error creating adjustment lines' });
          }
          
          completed++;
          if (completed === totalLines) {
            db.run('COMMIT');
            res.status(201).json({
              message: 'Adjustment created successfully',
              id: adjustmentId
            });
          }
        });
      });
    });
  });
});

// Validate adjustment (apply the changes to stock)
router.put('/:id/validate', (req, res) => {
  const { id } = req.params;
  const { validated_by } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get adjustment lines
    const getLinesSql = 'SELECT * FROM adjustment_lines WHERE adjustment_id = ?';
    db.all(getLinesSql, [id], (err, lines) => {
      if (err) {
        console.error('Error fetching adjustment lines for validation:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error fetching adjustment lines' });
      }
      
      if (lines.length === 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ message: 'No lines to validate' });
      }
      
      let completed = 0;
      const totalLines = lines.length;
      
      lines.forEach((line) => {
        // Get current stock
        const getCurrentStockSql = 'SELECT qty FROM stock WHERE product_id = ? AND location_id = ?';
        db.get(getCurrentStockSql, [line.product_id, line.location_id], (err, stock) => {
          if (err) {
            console.error('Error getting current stock:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Error getting current stock' });
          }
          
          const currentQty = stock ? stock.qty : 0;
          const adjustmentQty = line.counted_qty - currentQty;
          
          // Update or insert stock
          if (stock) {
            const updateStockSql = `
              UPDATE stock SET 
                qty = ?,
                last_updated = datetime('now')
              WHERE product_id = ? AND location_id = ?
            `;
            
            db.run(updateStockSql, [line.counted_qty, line.product_id, line.location_id], (err) => {
              if (err) {
                console.error('Error updating stock:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error updating stock' });
              }
              
              finalizeAdjustmentLine();
            });
          } else {
            const insertStockSql = `
              INSERT INTO stock (product_id, location_id, qty, reserved, last_updated)
              VALUES (?, ?, ?, 0, datetime('now'))
            `;
            
            db.run(insertStockSql, [line.product_id, line.location_id, line.counted_qty], (err) => {
              if (err) {
                console.error('Error inserting stock:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error inserting stock' });
              }
              
              finalizeAdjustmentLine();
            });
          }
          
          function finalizeAdjustmentLine() {
            // Insert stock ledger entry
            const ledgerSql = `
              INSERT INTO stock_ledger (
                product_id, timestamp, user_id, type, ref_id,
                location_from, location_to, qty_change, balance_after, note
              ) VALUES (?, datetime('now'), ?, 'adjustment', ?, ?, ?, ?, ?)
            `;
            
            db.run(ledgerSql, [
              line.product_id,
              validated_by,
              id,
              line.location_id,
              line.location_id,
              adjustmentQty,
              line.counted_qty,
              `Stock adjustment: ${adjustmentQty > 0 ? 'increase' : 'decrease'}`
            ], (err) => {
              if (err) {
                console.error('Error inserting stock ledger:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Error inserting stock ledger' });
              }
              
              completed++;
              if (completed === totalLines) {
                // Update adjustment status
                const updateAdjustmentSql = `
                  UPDATE adjustments SET 
                    status = 'validated',
                    validated_by = ?,
                    validated_at = datetime('now')
                  WHERE id = ?
                `;
                
                db.run(updateAdjustmentSql, [validated_by, id], (err) => {
                  if (err) {
                    console.error('Error updating adjustment status:', err);
                    db.run('ROLLBACK');
                    return res.status(500).json({ message: 'Error updating adjustment status' });
                  }
                  
                  db.run('COMMIT');
                  res.json({ message: 'Adjustment validated and applied successfully' });
                });
              }
            });
          }
        });
      });
    });
  });
});

export default router;
