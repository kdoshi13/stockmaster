import express from 'express';
import { db } from './database.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      id,
      email,
      name,
      phone,
      role,
      verified,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `;
  
  db.all(sql, (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Error fetching users' });
    }
    res.json(users);
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      id,
      email,
      name,
      phone,
      role,
      verified,
      created_at,
      updated_at
    FROM users
    WHERE id = ?
  `;
  
  db.get(sql, [id], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ message: 'Error fetching user' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  });
});

// Update user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, verified } = req.body;
  
  // Build dynamic update query based on provided fields
  const updates = [];
  const values = [];
  
  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  
  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }
  
  if (role !== undefined) {
    updates.push('role = ?');
    values.push(role);
  }
  
  if (verified !== undefined) {
    updates.push('verified = ?');
    values.push(verified ? 1 : 0);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  if (updates.length === 1) { // Only updated_at
    return res.status(400).json({ message: 'No fields to update' });
  }
  
  values.push(id);
  
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(sql, values, function(err) {
    if (err) {
      console.error('Error updating user:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: 'Error updating user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Check if user exists and is not the last admin
  const checkSql = `
    SELECT role FROM users WHERE id = ?
  `;
  
  db.get(checkSql, [id], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ message: 'Error checking user' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If deleting an admin, check if there are other admins
    if (user.role === 'admin') {
      const countAdminsSql = `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
      
      db.get(countAdminsSql, (err, result) => {
        if (err) {
          console.error('Error counting admins:', err);
          return res.status(500).json({ message: 'Error checking admin count' });
        }
        
        if (result.count <= 1) {
          return res.status(400).json({ 
            message: 'Cannot delete the last admin user' 
          });
        }
        
        // Proceed with deletion
        deleteUser(id, res);
      });
    } else {
      // Not an admin, proceed with deletion
      deleteUser(id, res);
    }
  });
});

// Helper function to delete user
function deleteUser(id, res) {
  const sql = `DELETE FROM users WHERE id = ?`;
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Error deleting user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
}

// Get user statistics
router.get('/stats/overview', (req, res) => {
  const stats = {};
  
  // Total users
  const totalUsersSql = `SELECT COUNT(*) as count FROM users`;
  db.get(totalUsersSql, (err, result) => {
    if (err) {
      console.error('Error getting total users:', err);
      return res.status(500).json({ message: 'Error fetching user stats' });
    }
    stats.totalUsers = result.count;
    
    // Active users (verified)
    const activeUsersSql = `SELECT COUNT(*) as count FROM users WHERE verified = 1`;
    db.get(activeUsersSql, (err, result) => {
      if (err) {
        console.error('Error getting active users:', err);
        return res.status(500).json({ message: 'Error fetching user stats' });
      }
      stats.activeUsers = result.count;
      
      // Users by role
      const rolesSql = `
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `;
      db.all(rolesSql, (err, roles) => {
        if (err) {
          console.error('Error getting users by role:', err);
          return res.status(500).json({ message: 'Error fetching user stats' });
        }
        stats.usersByRole = roles;
        
        // Recent registrations (last 7 days)
        const recentSql = `
          SELECT COUNT(*) as count 
          FROM users 
          WHERE created_at >= datetime('now', '-7 days')
        `;
        db.get(recentSql, (err, result) => {
          if (err) {
            console.error('Error getting recent users:', err);
            return res.status(500).json({ message: 'Error fetching user stats' });
          }
          stats.recentRegistrations = result.count;
          
          res.json(stats);
        });
      });
    });
  });
});

// Update user password (admin function)
router.put('/:id/password', async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long' 
    });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const sql = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    db.run(sql, [hashedPassword, id], function(err) {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ message: 'Error updating password' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ message: 'Password updated successfully' });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ message: 'Error updating password' });
  }
});

export default router;
