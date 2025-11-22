import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Products CRUD operations
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      p.*,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM products p
    LEFT JOIN users u1 ON p.created_by = u1.id
    LEFT JOIN users u2 ON p.updated_by = u2.id
    ORDER BY p.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: 'Error fetching products' });
    }
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      p.*,
      u1.name as created_by_name,
      u2.name as updated_by_name
    FROM products p
    LEFT JOIN users u1 ON p.created_by = u1.id
    LEFT JOIN users u2 ON p.updated_by = u2.id
    WHERE p.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching product:', err);
      return res.status(500).json({ message: 'Error fetching product' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(row);
  });
});

router.post('/', (req, res) => {
  const {
    id_code,
    name,
    category,
    unit_of_measure,
    reorder_threshold,
    reorder_target,
    created_by
  } = req.body;

  const sql = `
    INSERT INTO products (
      id_code, name, category, unit_of_measure, 
      reorder_threshold, reorder_target, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [
    id_code, name, category, unit_of_measure,
    reorder_threshold, reorder_target, created_by
  ], function(err) {
    if (err) {
      console.error('Error creating product:', err);
      return res.status(500).json({ message: 'Error creating product' });
    }
    res.status(201).json({ 
      message: 'Product created successfully',
      id: this.lastID 
    });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    id_code,
    name,
    category,
    unit_of_measure,
    reorder_threshold,
    reorder_target,
    updated_by
  } = req.body;

  const sql = `
    UPDATE products SET
      id_code = ?, name = ?, category = ?, unit_of_measure = ?,
      reorder_threshold = ?, reorder_target = ?, updated_by = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `;

  db.run(sql, [
    id_code, name, category, unit_of_measure,
    reorder_threshold, reorder_target, updated_by, id
  ], function(err) {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).json({ message: 'Error updating product' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if product is referenced in stock, receipts, deliveries, etc.
  const checkSql = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM stock WHERE product_id = ?
      UNION ALL
      SELECT 1 FROM receipt_lines WHERE product_id = ?
      UNION ALL  
      SELECT 1 FROM delivery_lines WHERE product_id = ?
      UNION ALL
      SELECT 1 FROM transfer_lines WHERE product_id = ?
      UNION ALL
      SELECT 1 FROM adjustment_lines WHERE product_id = ?
      LIMIT 1
    )
  `;

  db.get(checkSql, [id, id, id, id, id], (err, row) => {
    if (err) {
      console.error('Error checking product references:', err);
      return res.status(500).json({ message: 'Error checking product references' });
    }

    if (row.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete product. It has associated stock or transaction records.' 
      });
    }

    const deleteSql = 'DELETE FROM products WHERE id = ?';
    db.run(deleteSql, [id], function(err) {
      if (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ message: 'Error deleting product' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    });
  });
});

export default router;
