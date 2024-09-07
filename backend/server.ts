// All routes defined in server.ts with the DM functionality, user tracking, and active users

import express, { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected...');
});

// Authentication middleware
const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access denied.');

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);
    (req as any).user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token.');
  }
};

// Signup route with improved error handling and logging
app.post('/signup', async (req: Request, res: Response) => {
    const { username, password } = req.body;
  
    // Check if username and password are provided
    if (!username || !password) {
      return res.status(400).send('Username and password are required.');
    }
  
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Insert user into the database
      const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
      db.execute(query, [username, hashedPassword], (err) => {
        if (err) {
          console.error('Database Error:', err); // Log the error for debugging
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Username already taken.');
          }
          return res.status(500).send('Server error while creating user.');
        }
        res.send('User registered.');
      });
    } catch (err) {
      console.error('Error during signup:', err); // Log the error for debugging
      res.status(500).send('Error during signup process.');
    }
  });

// Login route with user online status update
app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ?`;

  db.execute(query, [username], async (err, results: any) => {
    if (err || results.length === 0) return res.status(400).send('Invalid username.');

    const validPass = await bcrypt.compare(password, results[0].password);
    if (!validPass) return res.status(400).send('Invalid password.');

    const token = jwt.sign({ id: results[0].id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

    // Set user as online
    db.execute(`UPDATE users SET online_status = TRUE WHERE id = ?`, [results[0].id]);

    res.json({ token });
  });
});

// Logout route
app.post('/logout', auth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  // Set user as offline
  db.execute(`UPDATE users SET online_status = FALSE WHERE id = ?`, [userId], (err) => {
    if (err) throw err;
    res.send('Logged out successfully.');
  });
});

// Get messages
app.get('/messages', auth, (req: Request, res: Response) => {
  const query = `SELECT users.username, messages.message, messages.timestamp
                 FROM messages
                 JOIN users ON messages.user_id = users.id
                 ORDER BY messages.timestamp ASC`;
  db.execute(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Send a message
app.post('/messages', auth, (req: Request, res: Response) => {
  const { message } = req.body;
  const query = `INSERT INTO messages (user_id, message) VALUES (?, ?)`;
  db.execute(query, [(req as any).user.id, message], (err) => {
    if (err) throw err;
    res.send('Message sent.');
  });
});

// Get online users
app.get('/online-users', auth, (req: Request, res: Response) => {
  const query = `SELECT id, username, created_at FROM users WHERE online_status = TRUE`;
  db.execute(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Send a direct message
app.post('/dm/:receiverId', auth, (req: Request, res: Response) => {
  const { message } = req.body;
  const { receiverId } = req.params;

  const query = `INSERT INTO direct_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`;
  db.execute(query, [(req as any).user.id, receiverId, message], (err) => {
    if (err) throw err;
    res.send('Direct message sent.');
  });
});

// Get direct messages with a specific user
app.get('/dm/:receiverId', auth, (req: Request, res: Response) => {
  const { receiverId } = req.params;

  const query = `SELECT users.username AS sender, direct_messages.message, direct_messages.timestamp
                 FROM direct_messages
                 JOIN users ON direct_messages.sender_id = users.id
                 WHERE (sender_id = ? AND receiver_id = ?)
                    OR (sender_id = ? AND receiver_id = ?)
                 ORDER BY direct_messages.timestamp ASC`;
  db.execute(query, [(req as any).user.id, receiverId, receiverId, (req as any).user.id], (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
