import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get all locations
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      l.*,
      pl.name as parent_name
    FROM locations l
    LEFT JOIN locations pl ON l.parent_id = pl.id
    ORDER BY l.name
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Error fetching locations:', err);
      return res.status(500).json({ message: 'Error fetching locations' });
    }
    res.json(rows);
  });
});

// Get location by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      l.*,
      pl.name as parent_name
    FROM locations l
    LEFT JOIN locations pl ON l.parent_id = pl.id
    WHERE l.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching location:', err);
      return res.status(500).json({ message: 'Error fetching location' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(row);
  });
});

// Create new location
router.post('/', (req, res) => {
  const {
    code,
    name,
    type,
    parent_id
  } = req.body;

  const sql = `
    INSERT INTO locations (code, name, type, parent_id, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `;

  db.run(sql, [code, name, type, parent_id], function(err) {
    if (err) {
      console.error('Error creating location:', err);
      return res.status(500).json({ message: 'Error creating location' });
    }
    res.status(201).json({ 
      message: 'Location created successfully',
      id: this.lastID 
    });
  });
});

// Update location
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    code,
    name,
    type,
    parent_id
  } = req.body;

  const sql = `
    UPDATE locations SET
      code = ?, name = ?, type = ?, parent_id = ?
    WHERE id = ?
  `;

  db.run(sql, [code, name, type, parent_id, id], function(err) {
    if (err) {
      console.error('Error updating location:', err);
      return res.status(500).json({ message: 'Error updating location' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json({ message: 'Location updated successfully' });
  });
});

// Delete location
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if location is referenced in stock or other tables
  const checkSql = `
    SELECT COUNT(*) as count FROM (
      SELECT 1 FROM stock WHERE location_id = ?
      UNION ALL
      SELECT 1 FROM receipt_lines WHERE location_id = ?
      UNION ALL  
      SELECT 1 FROM delivery_lines WHERE location_id = ?
      UNION ALL
      SELECT 1 FROM locations WHERE parent_id = ?
      LIMIT 1
    )
  `;

  db.get(checkSql, [id, id, id, id], (err, row) => {
    if (err) {
      console.error('Error checking location references:', err);
      return res.status(500).json({ message: 'Error checking location references' });
    }

    if (row.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete location. It has associated stock, transactions, or sub-locations.' 
      });
    }

    const deleteSql = 'DELETE FROM locations WHERE id = ?';
    db.run(deleteSql, [id], function(err) {
      if (err) {
        console.error('Error deleting location:', err);
        return res.status(500).json({ message: 'Error deleting location' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json({ message: 'Location deleted successfully' });
    });
  });
});

export default router;
