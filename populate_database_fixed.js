import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verboseSqlite = sqlite3.verbose();
const dbPath = path.join(__dirname, 'stock.db');
const db = new verboseSqlite.Database(dbPath);

async function addSampleData() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        console.log('Adding sample data to database...');
        
        // Add sample locations
        console.log('Adding locations...');
        const locations = [
          ['WH-001', 'Main Warehouse', 'warehouse', null],
          ['WH-002', 'Cold Storage', 'cold_storage', 1],
          ['WH-003', 'Loading Dock', 'loading_dock', 1],
          ['ST-001', 'Aisle A-1', 'aisle', 1],
          ['ST-002', 'Aisle A-2', 'aisle', 1],
          ['ST-003', 'B-1 Section', 'section', 1],
          ['ST-004', 'B-2 Section', 'section', 1]
        ];
        
        for (const [code, name, type, parent_id] of locations) {
          db.run(
            'INSERT OR IGNORE INTO locations (code, name, type, parent_id, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
            [code, name, type, parent_id]
          );
        }
        
        // Add sample vendors
        console.log('Adding vendors...');
        const vendors = [
          ['VND-001', 'TechParts Supply Co.', 'John Smith', '+1-555-0101', 'john@techparts.com'],
          ['VND-002', 'Industrial Solutions Ltd.', 'Sarah Johnson', '+1-555-0102', 'sarah@industrialsol.com'],
          ['VND-003', 'Office Supplies Plus', 'Mike Wilson', '+1-555-0103', 'mike@officesupply.com'],
          ['VND-004', 'Electronics Wholesale', 'Lisa Chen', '+1-555-0104', 'lisa@electronics.com']
        ];
        
        for (const [code, name, contact, phone, email] of vendors) {
          db.run(
            'INSERT OR IGNORE INTO vendors (code, name, contact, phone, email, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
            [code, name, contact, phone, email]
          );
        }
        
        // Add sample products
        console.log('Adding products...');
        const products = [
          ['LAPTOP-001', 'Dell Latitude 5520 Laptop', 'Electronics', 'piece', 5, 20, 1],
          ['MOUSE-002', 'Logitech MX Master Mouse', 'Electronics', 'piece', 10, 50, 1],
          ['MONITOR-003', 'Samsung 27" 4K Monitor', 'Electronics', 'piece', 3, 15, 1],
          ['KEYBOARD-004', 'Mechanical Keyboard', 'Electronics', 'piece', 8, 40, 1],
          ['PRINTER-005', 'HP LaserJet Pro M404n', 'Electronics', 'piece', 2, 10, 1],
          ['PAPER-006', 'A4 White Paper (500 sheets)', 'Office Supplies', 'ream', 20, 100, 1],
          ['PEN-007', 'Blue Ballpoint Pens (12 pack)', 'Office Supplies', 'box', 30, 150, 1],
          ['STAPLER-008', 'Heavy Duty Stapler', 'Office Supplies', 'piece', 5, 25, 1],
          ['CALCULATOR-009', 'Scientific Calculator', 'Office Supplies', 'piece', 8, 40, 1],
          ['LAMP-010', 'LED Desk Lamp', 'Office Supplies', 'piece', 6, 30, 1],
          ['CABLE-011', 'USB-C Cable 6ft', 'Electronics', 'piece', 15, 75, 1],
          ['HEADSET-012', 'Noise Cancelling Headset', 'Electronics', 'piece', 4, 20, 1],
          ['WEBCAM-013', '1080p Webcam', 'Electronics', 'piece', 5, 25, 1],
          ['SSD-014', '1TB NVMe SSD', 'Electronics', 'piece', 3, 15, 1],
          ['RAM-015', '32GB DDR4 RAM', 'Electronics', 'piece', 2, 10, 1]
        ];
        
        for (const [id_code, name, category, unit_of_measure, reorder_threshold, reorder_target, created_by] of products) {
          db.run(
            'INSERT OR IGNORE INTO products (id_code, name, category, unit_of_measure, reorder_threshold, reorder_target, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
            [id_code, name, category, unit_of_measure, reorder_threshold, reorder_target, created_by]
          );
        }
        
        // Add initial stock levels
        console.log('Adding stock levels...');
        const stockLevels = [
          // Dell Laptops
          [1, 1, 12, 0],  // product 1, location 1, qty 12
          [1, 4, 8, 0],   // product 1, location 4, qty 8
          // Mice
          [2, 1, 45, 0],
          [2, 5, 32, 0],
          // Monitors
          [3, 1, 8, 0],
          [3, 6, 5, 0],
          // Keyboards
          [4, 1, 28, 0],
          [4, 5, 22, 0],
          // Printers
          [5, 1, 3, 0],
          [5, 3, 2, 0],
          // Paper
          [6, 1, 85, 0],
          [6, 5, 62, 0],
          // Pens
          [7, 1, 125, 0],
          [7, 6, 98, 0],
          // Staplers
          [8, 1, 15, 0],
          [8, 7, 12, 0],
          // Calculators
          [9, 1, 32, 0],
          [9, 6, 18, 0],
          // Desk Lamps
          [10, 1, 20, 0],
          [10, 4, 15, 0],
          // USB Cables
          [11, 1, 68, 0],
          [11, 5, 52, 0],
          // Headsets
          [12, 1, 18, 0],
          [12, 6, 12, 0],
          // Webcams
          [13, 1, 22, 0],
          [13, 4, 16, 0],
          // SSDs
          [14, 1, 8, 0],
          [14, 2, 3, 0],
          // RAM
          [15, 1, 5, 0],
          [15, 2, 2, 0]
        ];
        
        for (const [product_id, location_id, qty, reserved] of stockLevels) {
          db.run(
            'INSERT OR IGNORE INTO stock (product_id, location_id, qty, reserved, last_updated) VALUES (?, ?, ?, ?, datetime("now"))',
            [product_id, location_id, qty, reserved]
          );
        }
        
        // Add sample receipts
        console.log('Adding receipts...');
        
        // Receipt 1
        db.run('INSERT OR IGNORE INTO receipts (ref, vendor_id, status, created_by, created_at, note) VALUES (?, ?, ?, ?, datetime("now"), ?)',
          ['REC-2025-001', 1, 'validated', 1, 'Initial laptop shipment']);
        
        const receipt1Id = 1; // Assuming this gets ID 1
        
        // Add receipt lines for receipt 1
        const receipt1Lines = [
          [receipt1Id, 1, 1, 15, 15],  // 15 laptops to main warehouse
          [receipt1Id, 1, 4, 10, 10]   // 10 laptops to aisle A-1
        ];
        
        for (const [receipt_id, product_id, location_id, expected_qty, received_qty] of receipt1Lines) {
          db.run(
            'INSERT OR IGNORE INTO receipt_lines (receipt_id, product_id, location_id, expected_qty, received_qty, note) VALUES (?, ?, ?, ?, ?, ?)',
            [receipt_id, product_id, location_id, expected_qty, received_qty, 'Validated stock']
          );
        }
        
        // Receipt 2
        db.run('INSERT OR IGNORE INTO receipts (ref, vendor_id, status, created_by, created_at, note) VALUES (?, ?, ?, ?, datetime("now"), ?)',
          ['REC-2025-002', 3, 'validated', 1, 'Office supplies restock']);
        
        const receipt2Id = 2;
        
        const receipt2Lines = [
          [receipt2Id, 6, 1, 100, 100],  // 100 reams of paper
          [receipt2Id, 7, 1, 50, 50],    // 50 boxes of pens
          [receipt2Id, 8, 1, 20, 20]     // 20 staplers
        ];
        
        for (const [receipt_id, product_id, location_id, expected_qty, received_qty] of receipt2Lines) {
          db.run(
            'INSERT OR IGNORE INTO receipt_lines (receipt_id, product_id, location_id, expected_qty, received_qty, note) VALUES (?, ?, ?, ?, ?, ?)',
            [receipt_id, product_id, location_id, expected_qty, received_qty, 'Office supplies delivery']
          );
        }
        
        // Add sample deliveries
        console.log('Adding deliveries...');
        
        // Delivery 1
        db.run('INSERT OR IGNORE INTO deliveries (ref, customer_name, status, created_by, created_at, shipped_at, note) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"), ?)',
          ['DEL-2025-001', 'ABC Corporation', 'shipped', 1, 'Electronics order']);
        
        const delivery1Id = 1;
        
        const delivery1Lines = [
          [delivery1Id, 2, 1, 5, 'Wireless mice'],
          [delivery1Id, 11, 1, 10, 'USB-C cables'],
          [delivery1Id, 13, 1, 3, 'Webcams for conference room']
        ];
        
        for (const [delivery_id, product_id, location_id, qty, note] of delivery1Lines) {
          db.run(
            'INSERT OR IGNORE INTO delivery_lines (delivery_id, product_id, location_id, qty, note) VALUES (?, ?, ?, ?, ?)',
            [delivery_id, product_id, location_id, qty, note]
          );
        }
        
        // Add stock ledger entries for the movements
        console.log('Adding stock ledger entries...');
        const ledgerEntries = [
          [1, 'receipt', receipt1Id, 1, 15, 15, 'Initial laptop shipment'],
          [1, 'receipt', receipt1Id, 4, 10, 10, 'Initial laptop shipment'],
          [2, 'receipt', receipt2Id, 1, 100, 100, 'Office supplies delivery'],
          [2, 'receipt', receipt2Id, 1, 50, 50, 'Office supplies delivery'],
          [2, 'receipt', receipt2Id, 1, 20, 20, 'Office supplies delivery'],
          [2, 'delivery', delivery1Id, 1, -5, 40, 'ABC Corporation delivery'],
          [11, 'delivery', delivery1Id, 1, -10, 58, 'ABC Corporation delivery'],
          [13, 'delivery', delivery1Id, 1, -3, 19, 'ABC Corporation delivery']
        ];
        
        for (const [product_id, type, ref_id, location_to, qty_change, balance_after, note] of ledgerEntries) {
          db.run(
            'INSERT OR IGNORE INTO stock_ledger (product_id, timestamp, user_id, type, ref_id, location_to, qty_change, balance_after, note) VALUES (?, datetime("now"), ?, ?, ?, ?, ?, ?, ?)',
            [product_id, 1, type, ref_id, location_to, qty_change, balance_after, note]
          );
        }
        
        console.log('Sample data added successfully!');
        
        // Get counts to verify
        db.get('SELECT COUNT(*) as count FROM locations', (err, result) => {
          if (err) console.log('Error counting locations:', err);
          else console.log(`Locations: ${result.count}`);
        });
        
        db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
          if (err) console.log('Error counting products:', err);
          else console.log(`Products: ${result.count}`);
        });
        
        db.get('SELECT COUNT(*) as count FROM vendors', (err, result) => {
          if (err) console.log('Error counting vendors:', err);
          else console.log(`Vendors: ${result.count}`);
        });
        
        db.get('SELECT COUNT(*) as count FROM stock', (err, result) => {
          if (err) console.log('Error counting stock:', err);
          else console.log(`Stock records: ${result.count}`);
        });
        
        resolve();
        
      } catch (error) {
        console.error('Error adding sample data:', error);
        reject(error);
      }
    });
  });
}

addSampleData()
  .then(() => {
    console.log('Database population completed successfully!');
    db.close();
  })
  .catch((error) => {
    console.error('Database population failed:', error);
    db.close();
  });
