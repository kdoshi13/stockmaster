import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all stock records
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      s.*,
      p.name as product_name,
      p.id_code as product_code,
      l.name as location_name
    FROM stock s
    LEFT JOIN products p ON s.product_id = p.id
    LEFT JOIN locations l ON s.location_id = l.id
    ORDER BY p.name, l.name
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching stock:', err);
      return res.status(500).json({ message: 'Error fetching stock' });
    }
    res.json(rows);
  });
});

// Get stock for a specific product
router.get('/product/:productId', (req, res) => {
  const { productId } = req.params;
  const sql = `
    SELECT 
      s.*,
      l.name as location_name
    FROM stock s
    LEFT JOIN locations l ON s.location_id = l.id
    WHERE s.product_id = ?
    ORDER BY l.name
  `;
  
  db.all(sql, [productId], (err, rows) => {
    if (err) {
      console.error('Error fetching product stock:', err);
      return res.status(500).json({ message: 'Error fetching product stock' });
    }
    res.json(rows);
  });
});

// Get stock for a specific location
router.get('/location/:locationId', (req, res) => {
  const { locationId } = req.params;
  const sql = `
    SELECT 
      s.*,
      p.name as product_name,
      p.id_code as product_code
    FROM stock s
    LEFT JOIN products p ON s.product_id = p.id
    WHERE s.location_id = ?
    ORDER BY p.name
  `;
  
  db.all(sql, [locationId], (err, rows) => {
    if (err) {
      console.error('Error fetching location stock:', err);
      return res.status(500).json({ message: 'Error fetching location stock' });
    }
    res.json(rows);
  });
});

// Update stock quantity
router.put('/:productId/:locationId', (req, res) => {
  const { productId, locationId } = req.params;
  const { qty, reserved = 0, updated_by } = req.body;

  const sql = `
    UPDATE stock SET 
      qty = ?, reserved = ?, last_updated = datetime('now')
    WHERE product_id = ? AND location_id = ?
  `;

  db.run(sql, [qty, reserved, productId, locationId], function(err) {
    if (err) {
      console.error('Error updating stock:', err);
      return res.status(500).json({ message: 'Error updating stock' });
    }
    
    if (this.changes === 0) {
      // Stock record doesn't exist, create it
      const insertSql = `
        INSERT INTO stock (product_id, location_id, qty, reserved, last_updated)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;
      
      db.run(insertSql, [productId, locationId, qty, reserved], (err) => {
        if (err) {
          console.error('Error creating stock record:', err);
          return res.status(500).json({ message: 'Error creating stock record' });
        }
        res.json({ message: 'Stock record created successfully' });
      });
    } else {
      res.json({ message: 'Stock updated successfully' });
    }
  });
});

// Reserve stock (for pending transactions)
router.post('/reserve', (req, res) => {
  const { product_id, location_id, quantity } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Check available stock
    const checkSql = 'SELECT qty, reserved FROM stock WHERE product_id = ? AND location_id = ?';
    db.get(checkSql, [product_id, location_id], (err, stock) => {
      if (err) {
        console.error('Error checking stock:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Error checking stock' });
      }
      
      if (!stock) {
        db.run('ROLLBACK');
        return res.status(404).json({ message: 'Stock record not found' });
      }
      
      const availableQty = stock.qty - stock.reserved;
      if (availableQty < quantity) {
        db.run('ROLLBACK');
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${availableQty}, Required: ${quantity}` 
        });
      }
      
      // Reserve the stock
      const updateSql = `
        UPDATE stock SET 
          reserved = reserved + ?,
          last_updated = datetime('now')
        WHERE product_id = ? AND location_id = ?
      `;
      
      db.run(updateSql, [quantity, product_id, location_id], (err) => {
        if (err) {
          console.error('Error reserving stock:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error reserving stock' });
        }
        
        db.run('COMMIT');
        res.json({ message: 'Stock reserved successfully' });
      });
    });
  });
});

// Release reserved stock
router.post('/release', (req, res) => {
  const { product_id, location_id, quantity } = req.body;

  const sql = `
    UPDATE stock SET 
      reserved = reserved - ?,
      last_updated = datetime('now')
    WHERE product_id = ? AND location_id = ?
  `;

  db.run(sql, [quantity, product_id, location_id], function(err) {
    if (err) {
      console.error('Error releasing stock:', err);
      return res.status(500).json({ message: 'Error releasing stock' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Stock record not found' });
    }
    
    res.json({ message: 'Stock released successfully' });
  });
});

// Get stock movement history
router.get('/movements', (req, res) => {
  const sql = `
    SELECT 
      sl.id,
      sl.timestamp,
      sl.type,
      sl.qty_change,
      sl.balance_after,
      sl.note,
      sl.ref_id,
      p.name as product_name,
      p.id_code as product_code,
      u.name as user_name,
      lf.name as location_from_name,
      lt.name as location_to_name
    FROM stock_ledger sl
    LEFT JOIN products p ON sl.product_id = p.id
    LEFT JOIN users u ON sl.user_id = u.id
    LEFT JOIN locations lf ON sl.location_from = lf.id
    LEFT JOIN locations lt ON sl.location_to = lt.id
    ORDER BY sl.timestamp DESC
    LIMIT 100
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching stock movements:', err);
      return res.status(500).json({ message: 'Error fetching stock movements' });
    }
    res.json(rows);
  });
});

export default router;
