// d:\Users\HollowME\Desktop\StockMaster\email_server\server.js

// 1. Import necessary packages
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Import all route modules
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import receiptRoutes from './receiptRoutes.js';
import deliveryRoutes from './deliveryRoutes.js';
import locationRoutes from './locationRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import stockRoutes from './stockRoutes.js';
import transferRoutes from './transferRoutes.js';
import adjustmentRoutes from './adjustmentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import userRoutes from './userRoutes.js';
import { db } from './database.js';

// 2. Configure environment variables
dotenv.config();

// 3. Create the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Add middleware
// Enable CORS for all origins
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// This allows your server to understand JSON request bodies
app.use(express.json());

// 5. Define routes
// Authentication routes
app.use('/api/auth', authRoutes);

// Products routes
app.use('/api/products', productRoutes);

// Receipts routes
app.use('/api/receipts', receiptRoutes);

// Deliveries routes
app.use('/api/deliveries', deliveryRoutes);

// Locations routes
app.use('/api/locations', locationRoutes);

// Vendors routes
app.use('/api/vendors', vendorRoutes);

// Stock routes
app.use('/api/stock', stockRoutes);

// Transfers routes
app.use('/api/transfers', transferRoutes);

// Adjustments routes
app.use('/api/adjustments', adjustmentRoutes);

// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);

// Users routes
app.use('/api/users', userRoutes);

// Stock movement history endpoint
app.get('/api/stock/movements', (req, res) => {
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

// A simple root route to check if the server is running
app.get('/', (req, res) => {
  res.send('StockMaster API is running!');
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for frontend on http://localhost:5173`);
  console.log(`Available API endpoints:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/products`);
  console.log(`  GET  /api/receipts`);
  console.log(`  GET  /api/deliveries`);
  console.log(`  GET  /api/locations`);
  console.log(`  GET  /api/vendors`);
  console.log(`  GET  /api/stock`);
  console.log(`  GET  /api/stock/movements`);
  console.log(`  GET  /api/transfers`);
  console.log(`  GET  /api/adjustments`);
  console.log(`  GET  /api/dashboard/stats`);
  console.log(`  GET  /api/users`);
  console.log(`  PUT  /api/users/:id`);
  console.log(`  DELETE /api/users/:id`);
});
