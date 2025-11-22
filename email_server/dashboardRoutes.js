import express from 'express';
import { db } from './database.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', (req, res) => {
  const stats = {};
  
  // Get total products count
  const productsCountSql = 'SELECT COUNT(*) as count FROM products';
  db.get(productsCountSql, (err, result) => {
    if (err) {
      console.error('Error getting products count:', err);
      return res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
    stats.totalProducts = result.count;
    
    // Get total locations count
    const locationsCountSql = 'SELECT COUNT(*) as count FROM locations';
    db.get(locationsCountSql, (err, result) => {
      if (err) {
        console.error('Error getting locations count:', err);
        return res.status(500).json({ message: 'Error fetching dashboard stats' });
      }
      stats.totalLocations = result.count;
      
      // Get total stock value
      const stockValueSql = `
        SELECT SUM(s.qty * COALESCE(p_avg.avg_cost, 0)) as total_value
        FROM stock s
        LEFT JOIN (
          SELECT 
            product_id,
            AVG(
              CASE 
                WHEN type = 'receipt' AND ref_id IN (
                  SELECT id FROM receipts WHERE status = 'validated'
                ) THEN qty_change
                ELSE NULL
              END
            ) as avg_cost
          FROM stock_ledger
          WHERE type = 'receipt'
          GROUP BY product_id
        ) p_avg ON s.product_id = p_avg.product_id
      `;
      db.get(stockValueSql, (err, result) => {
        if (err) {
          console.error('Error getting stock value:', err);
          return res.status(500).json({ message: 'Error fetching dashboard stats' });
        }
        stats.totalStockValue = result.total_value || 0;
        
        // Get pending receipts count
        const pendingReceiptsSql = `
          SELECT COUNT(*) as count FROM receipts 
          WHERE status = 'draft'
        `;
        db.get(pendingReceiptsSql, (err, result) => {
          if (err) {
            console.error('Error getting pending receipts count:', err);
            return res.status(500).json({ message: 'Error fetching dashboard stats' });
          }
          stats.pendingReceipts = result.count;
          
          // Get pending deliveries count
          const pendingDeliveriesSql = `
            SELECT COUNT(*) as count FROM deliveries 
            WHERE status = 'draft'
          `;
          db.get(pendingDeliveriesSql, (err, result) => {
            if (err) {
              console.error('Error getting pending deliveries count:', err);
              return res.status(500).json({ message: 'Error fetching dashboard stats' });
            }
            stats.pendingDeliveries = result.count;
            
            // Get recent activities (last 10 transactions)
            const recentActivitiesSql = `
              SELECT 
                sl.*,
                p.name as product_name,
                l_from.name as location_from_name,
                l_to.name as location_to_name,
                u.name as user_name
              FROM stock_ledger sl
              LEFT JOIN products p ON sl.product_id = p.id
              LEFT JOIN locations l_from ON sl.location_from = l_from.id
              LEFT JOIN locations l_to ON sl.location_to = l_to.id
              LEFT JOIN users u ON sl.user_id = u.id
              ORDER BY sl.timestamp DESC
              LIMIT 10
            `;
            db.all(recentActivitiesSql, (err, activities) => {
              if (err) {
                console.error('Error getting recent activities:', err);
                return res.status(500).json({ message: 'Error fetching dashboard stats' });
              }
              stats.recentActivities = activities;
              
              // Get low stock products (below reorder threshold)
              const lowStockSql = `
                SELECT 
                  p.id,
                  p.id_code,
                  p.name,
                  p.reorder_threshold,
                  s.qty,
                  l.name as location_name
                FROM products p
                LEFT JOIN stock s ON p.id = s.product_id
                LEFT JOIN locations l ON s.location_id = l.id
                WHERE p.reorder_threshold IS NOT NULL 
                  AND p.reorder_threshold > 0
                  AND s.qty < p.reorder_threshold
                ORDER BY (s.qty / p.reorder_threshold) ASC
                LIMIT 10
              `;
              db.all(lowStockSql, (err, lowStock) => {
                if (err) {
                  console.error('Error getting low stock:', err);
                  return res.status(500).json({ message: 'Error fetching dashboard stats' });
                }
                stats.lowStock = lowStock;
                
                res.json(stats);
              });
            });
          });
        });
      });
    });
  });
});

export default router;
