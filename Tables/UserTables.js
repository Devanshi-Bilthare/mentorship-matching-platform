const connection = require('../config/db');  // Make sure the path is correct

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('mentor', 'mentee') DEFAULT NULL,
    skills JSON,
    interests JSON,
    bio TEXT,
    sent_requests JSON, 
  received_requests JSON,
  connections JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.query(createTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating table:', err.stack);
  } else {
    console.log('Users table created (or already exists)');
  }
});
