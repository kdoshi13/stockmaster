import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all vendors
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM vendors ORDER BY name';
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching vendors:', err);
      return res.status(500).json({ message: 'Error fetching vendors' });
    }
    res.json(rows);
  });
});

// Get vendor by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM vendors WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching vendor:', err);
      return res.status(500).json({ message: 'Error fetching vendor' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(row);
  });
});

// Create new vendor
router.post('/', (req, res) => {
  const {
    code,
    name,
    contact,
    phone,
    email
  } = req.body;

  const sql = `
    INSERT INTO vendors (code, name, contact, phone, email, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [code, name, contact, phone, email], function(err) {
    if (err) {
      console.error('Error creating vendor:', err);
      return res.status(500).json({ message: 'Error creating vendor' });
    }
    res.status(201).json({ 
      message: 'Vendor created successfully',
      id: this.lastID 
    });
  });
});

// Update vendor
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    code,
    name,
    contact,
    phone,
    email
  } = req.body;

  const sql = `
    UPDATE vendors SET
      code = ?, name = ?, contact = ?, phone = ?, email = ?
    WHERE id = ?
  `;

  db.run(sql, [code, name, contact, phone, email, id], function(err) {
    if (err) {
      console.error('Error updating vendor:', err);
      return res.status(500).json({ message: 'Error updating vendor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor updated successfully' });
  });
});

// Delete vendor
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if vendor is referenced in receipts
  const checkSql = 'SELECT COUNT(*) as count FROM receipts WHERE vendor_id = ?';
  db.get(checkSql, [id], (err, row) => {
    if (err) {
      console.error('Error checking vendor references:', err);
      return res.status(500).json({ message: 'Error checking vendor references' });
    }

    if (row.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete vendor. It has associated receipts.' 
      });
    }

    const deleteSql = 'DELETE FROM vendors WHERE id = ?';
    db.run(deleteSql, [id], function(err) {
      if (err) {
        console.error('Error deleting vendor:', err);
        return res.status(500).json({ message: 'Error deleting vendor' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      res.json({ message: 'Vendor deleted successfully' });
    });
  });
});

export default router;
