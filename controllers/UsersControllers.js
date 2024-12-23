const bcrypt = require('bcrypt');
const connection = require('../config/db');
const { generateToken } = require('../config/jwtToken');

const RegisterUser = async (req, res) => {
  const { name, email, password, role, skills, interests, bio } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields: name, email, password, role' });
  }

  try {
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error checking user', details: err.message });
      }
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertUserQuery = `
        INSERT INTO users (name, email, password, role, skills, interests, bio) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      connection.query(
        insertUserQuery, 
        [name, email, hashedPassword, role, JSON.stringify(skills), JSON.stringify(interests), bio],
        (err, results) => {
          if (err) {
            return res.status(500).json({ error: 'Error inserting user', details: err.message });
          }
          
          const token = generateToken(results.insertId)

          res.status(201).json({
            message: 'User registered successfully',
            userId: results.insertId,
            token: token,
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

const LoginUser = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }
  
    try {
      const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
      connection.query(checkUserQuery, [email], async (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error checking user', details: err.message });
        }
  
        if (results.length === 0) {
          return res.status(400).json({ error: 'User not found' });
        }
  
        const user = results[0];
  
        const isPasswordMatch = await bcrypt.compare(password, user.password);
  
        if (!isPasswordMatch) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        const token = generateToken(user.id);
  
        res.status(200).json({
          message: 'Login successful',
          userId: user.id,
          token: token,
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  };


  const EditProfile = async (req, res) => {
    const { name, email, role, skills, interests, bio } = req.body;
    const userId = req.userId;
  
    if (!userId) {
      return res.status(401).json({ error: 'User not authorized' });
    }
  
    try {
      const getUserQuery = 'SELECT * FROM users WHERE id = ?';
      connection.query(getUserQuery, [userId], async (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching user data', details: err.message });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        const currentUser = results[0];
  
        const updatedName = name || currentUser.name;
        const updatedEmail = email || currentUser.email;
        const updatedRole = role || currentUser.role;
        const updatedSkills = skills ? JSON.stringify(skills) : currentUser.skills;
        const updatedInterests = interests ? JSON.stringify(interests) : currentUser.interests;
        const updatedBio = bio || currentUser.bio;
  
        const checkUserQuery = 'SELECT * FROM users WHERE email = ? AND id != ?';
        connection.query(checkUserQuery, [updatedEmail, userId], (err, results) => {
          if (err) {
            return res.status(500).json({ error: 'Error checking user email', details: err.message });
          }
  
          if (results.length > 0) {
            return res.status(400).json({ error: 'Email is already in use by another user' });
          }
  
          const updateData = [updatedName, updatedEmail, updatedRole, updatedSkills, updatedInterests, updatedBio, userId];
  
          const updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?, skills = ?, interests = ?, bio = ? WHERE id = ?';
  
          connection.query(updateQuery, updateData, (err, results) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating user profile', details: err.message });
            }
  
            if (results.affectedRows === 0) {
              return res.status(400).json({ error: 'User not found' });
            }
  
            res.status(200).json({
              message: 'Profile updated successfully',
            });
          });
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  };

  const DeleteProfile = async (req, res) => {
    const userId = Number(req.userId); 
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    const connectionPromise = connection.promise();
  
    try {
      await connectionPromise.beginTransaction();
  
      const [userExists] = await connectionPromise.query(`
        SELECT id FROM users WHERE id = ?
      `, [userId]);
  
      if (userExists.length === 0) {
        await connectionPromise.rollback();
        return res.status(404).json({ error: 'User not found' });
      }
  
      await connectionPromise.query(`
        UPDATE users 
        SET connections = JSON_REMOVE(connections, CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(connections)), ']') AS CHAR))
        WHERE JSON_CONTAINS(connections, JSON_ARRAY(?)) = 1
      `, [userId, userId]);
  
      await connectionPromise.query(`
        UPDATE users 
        SET sent_requests = JSON_REMOVE(sent_requests, 
          CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(sent_requests)), ']') AS CHAR))
        WHERE JSON_CONTAINS(sent_requests, JSON_ARRAY(?)) = 1
      `, [userId, userId]);
  
      await connectionPromise.query(`
        UPDATE users 
        SET received_requests = JSON_REMOVE(received_requests, 
          CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(received_requests)), ']') AS CHAR))
        WHERE JSON_CONTAINS(received_requests, JSON_ARRAY(?)) = 1
      `, [userId, userId]);
  
  
      await connectionPromise.query(`
        DELETE FROM users WHERE id = ?
      `, [userId]);
  
      await connectionPromise.commit();
  
      res.status(200).json({ message: 'User profile deleted successfully' });
    } catch (err) {
      await connectionPromise.rollback();
      res.status(500).json({ error: 'Error deleting profile', details: err.message });
    }
  };
  
  






  
  const GetProfile = (req, res) => {
    const userId = req.userId;
  
    if (!userId) {
      return res.status(401).json({ error: 'User not authorized' });
    }
  
    try {
      const getUserQuery = 'SELECT id, name, email, role, skills, interests, bio FROM users WHERE id = ?';
      connection.query(getUserQuery, [userId], (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching user data', details: err.message });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        const user = results[0]; // The user data
        res.status(200).json({
          message: 'Profile fetched successfully',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            skills: user.skills, 
            interests: user.interests,
            bio: user.bio
          }
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  };

  const GetAllProfiles = (req, res) => {
    const userId = req.params.id; 
    try {
      let getProfilesQuery;
      let queryParams = [];
  
      if (userId) {
        getProfilesQuery = 'SELECT id, name, email, role, skills, interests, bio FROM users WHERE id != ?';
        queryParams = [userId];
      } else {
        getProfilesQuery = 'SELECT id, name, email, role, skills, interests,sent_requests,received_requests,connections, bio FROM users';
      }
  
      connection.query(getProfilesQuery, queryParams, (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching user profiles', details: err.message });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: 'No user profiles found' });
        }
        console.log(results)
        const profiles = results.map(user => {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            skills: user.skills, 
            interests: user.interests, 
            bio: user.bio, 
            sendRequests: user.sent_requests, 
            receivedRequests: user.received_requests ,
            connections: user.connections 

          };
        });
  
        res.status(200).json({
          message: 'Profiles fetched successfully',
          profiles
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error', details: err.message });
    }
  };

  const SendRequest = (req, res) => {
    const senderId = Number(req.userId);
    const receiverId = Number(req.body.receiverId);
  
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender and receiver IDs are required' });
    }
  
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'You cannot send a request to yourself' });
    }
  
    const checkConnectionQuery = `
      SELECT * 
      FROM users 
      WHERE id = ? 
      AND JSON_CONTAINS(connections, JSON_ARRAY(?)) = 1
    `;
  
    connection.query(checkConnectionQuery, [senderId, receiverId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error checking connections', details: err.message });
      if (results.length > 0) return res.status(400).json({ error: 'You are already connected' });
  
      const checkReverseRequestQuery = `
        SELECT * 
        FROM users 
        WHERE id = ? 
        AND JSON_CONTAINS(sent_requests, JSON_ARRAY(?)) = 1
      `;
  
      connection.query(checkReverseRequestQuery, [receiverId, senderId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error checking reverse requests', details: err.message });
        if (results.length > 0) {
          return res.status(400).json({ error: 'Receiver has already sent you a request. Accept it instead.' });
        }
  
        const checkRequestQuery = `
          SELECT * 
          FROM users 
          WHERE id = ?
          AND (
            JSON_CONTAINS(sent_requests, JSON_ARRAY(?)) = 1
            OR JSON_CONTAINS(received_requests, JSON_ARRAY(?)) = 1
          )
        `;
  
        connection.query(checkRequestQuery, [senderId, receiverId, senderId], (err, results) => {
          if (err) return res.status(500).json({ error: 'Error checking existing requests', details: err.message });
          if (results.length > 0) return res.status(400).json({ error: 'Request already sent' });
  
          const querySender = `
            UPDATE users 
            SET sent_requests = JSON_ARRAY_APPEND(IFNULL(sent_requests, JSON_ARRAY()), "$", ?) 
            WHERE id = ?
          `;
  
          const queryReceiver = `
            UPDATE users 
            SET received_requests = JSON_ARRAY_APPEND(IFNULL(received_requests, JSON_ARRAY()), "$", ?) 
            WHERE id = ?
          `;
  
          connection.query(querySender, [receiverId, senderId], (err) => {
            if (err) return res.status(500).json({ error: 'Error updating sent_requests', details: err.message });
  
            connection.query(queryReceiver, [senderId, receiverId], (err) => {
              if (err) return res.status(500).json({ error: 'Error updating received_requests', details: err.message });
  
              res.status(200).json({ message: 'Connection request sent successfully' });
            });
          });
        });
      });
    });
  }; 


  const AcceptRequest = (req, res) => {
    const receiverId = Number(req.userId); 
    const senderId = Number(req.body.senderId); 
  
    if (!receiverId || !senderId) {
      return res.status(400).json({ error: 'Sender and receiver IDs are required' });
    }
  
    const checkRequestQuery = `
      SELECT * 
      FROM users 
      WHERE id = ? 
      AND JSON_CONTAINS(received_requests, JSON_ARRAY(?)) = 1
    `;
  
    connection.query(checkRequestQuery, [receiverId, senderId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error checking received requests', details: err.message });
      if (results.length === 0) {
        return res.status(400).json({ error: 'No connection request found from this user' });
      }
  
      const addConnectionToReceiver = `
        UPDATE users 
        SET connections = JSON_ARRAY_APPEND(IFNULL(connections, JSON_ARRAY()), "$", ?) 
        WHERE id = ?
      `;
  
      const addConnectionToSender = `
        UPDATE users 
        SET connections = JSON_ARRAY_APPEND(IFNULL(connections, JSON_ARRAY()), "$", ?) 
        WHERE id = ?
      `;
  
      const removeRequestFromReceiver = `
        UPDATE users 
        SET received_requests = JSON_REMOVE(received_requests, CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(received_requests)), ']') AS CHAR))
        WHERE id = ?
      `;
  
      const removeRequestFromSender = `
        UPDATE users
        SET sent_requests = JSON_REMOVE(sent_requests, CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(sent_requests)), ']') AS CHAR))
        WHERE id = ?
      `;
  
      connection.query(addConnectionToReceiver, [senderId, receiverId], (err) => {
        if (err) return res.status(500).json({ error: 'Error adding connection to receiver', details: err.message });
  
        connection.query(addConnectionToSender, [receiverId, senderId], (err) => {
          if (err) return res.status(500).json({ error: 'Error adding connection to sender', details: err.message });
  
          connection.query(removeRequestFromReceiver, [senderId, receiverId], (err) => {
            if (err) return res.status(500).json({ error: 'Error removing request from receiver', details: err.message });
  
            connection.query(removeRequestFromSender, [receiverId, senderId], (err) => {
              if (err) {
                return res.status(500).json({ error: 'Error removing request from sender', details: err.message });
              }
  
              res.status(200).json({ message: 'Connection request accepted successfully' });
            });
          });
        });
      });
    });
  };
  
  const RejectRequest = (req, res) => {
    const receiverId = Number(req.userId); 
    const senderId = Number(req.body.senderId); 
  
    if (!receiverId || !senderId) {
      return res.status(400).json({ error: 'Sender and receiver IDs are required' });
    }
  
    const checkRequestQuery = `
      SELECT * 
      FROM users 
      WHERE id = ? 
      AND JSON_CONTAINS(received_requests, JSON_ARRAY(?)) = 1
    `;
  
    connection.query(checkRequestQuery, [receiverId, senderId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error checking received requests', details: err.message });
      if (results.length === 0) {
        return res.status(400).json({ error: 'No connection request found from this user' });
      }
  
      const removeRequestFromReceiver = `
        UPDATE users 
        SET received_requests = JSON_REMOVE(received_requests, CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(received_requests)), ']') AS CHAR))
        WHERE id = ?
      `;
  
      const removeRequestFromSender = `
        UPDATE users
        SET sent_requests = JSON_REMOVE(sent_requests, CAST(CONCAT('$[', FIND_IN_SET(?, JSON_UNQUOTE(sent_requests)), ']') AS CHAR))
        WHERE id = ?
      `;
  
      connection.query(removeRequestFromReceiver, [senderId, receiverId], (err) => {
        if (err) return res.status(500).json({ error: 'Error removing request from receiver', details: err.message });
  
        connection.query(removeRequestFromSender, [receiverId, senderId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error removing request from sender', details: err.message });
          }
  
          res.status(200).json({ message: 'Connection request rejected successfully' });
        });
      });
    });
};

const GetSentRequests = (req, res) => {
  const userId = Number(req.userId); 

  if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
  }

  const getSentRequestsQuery = `
      SELECT sent_requests
      FROM users
      WHERE id = ?
  `;

  connection.query(getSentRequestsQuery, [userId], (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching sent requests', details: err.message });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      const sentRequests = results[0].sent_requests;
      
      if (!sentRequests || sentRequests.length === 0) {
          return res.status(200).json({ message: 'No sent requests found' });
      }

      const sentRequestsDetailsQuery = `
          SELECT id, name, email, role,bio,skills,interests
          FROM users
          WHERE id IN (?)
      `;

      connection.query(sentRequestsDetailsQuery, [sentRequests], (err, userDetails) => {
          if (err) {
              return res.status(500).json({ error: 'Error fetching user details for sent requests', details: err.message });
          }

          if (userDetails.length === 0) {
              return res.status(404).json({ error: 'No users found for the sent requests' });
          }

          res.status(200).json({ sentRequests: userDetails });
      });
  });
};

const GetReceivedRequests = (req, res) => {
  const userId = Number(req.userId); 

  if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
  }

  const getReceivedRequestsQuery = `
      SELECT received_requests
      FROM users
      WHERE id = ?
  `;

  connection.query(getReceivedRequestsQuery, [userId], (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching received requests', details: err.message });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      const receivedRequests = results[0].received_requests;
      
      if (!receivedRequests || receivedRequests.length === 0) {
          return res.status(200).json({ message: 'No received requests found' });
      }

      const receivedRequestsDetailsQuery = `
          SELECT id, name, email, role, bio, skills, interests
          FROM users
          WHERE id IN (?)
      `;

      connection.query(receivedRequestsDetailsQuery, [receivedRequests], (err, userDetails) => {
          if (err) {
              return res.status(500).json({ error: 'Error fetching user details for received requests', details: err.message });
          }

          if (userDetails.length === 0) {
              return res.status(404).json({ error: 'No users found for the received requests' });
          }

          res.status(200).json({ receivedRequests: userDetails });
      });
  });
};

const GetAllConnections = (req, res) => {
  const userId = Number(req.userId); 
  if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
  }

  const getConnectionsQuery = `
      SELECT connections
      FROM users
      WHERE id = ?
  `;

  connection.query(getConnectionsQuery, [userId], (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Error fetching connections', details: err.message });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      const connections = results[0].connections;
      
      if (!connections || connections.length === 0) {
          return res.status(200).json({ message: 'No connections found' });
      }

      const connectionsDetailsQuery = `
          SELECT id, name, email, role, bio,skills,interests
          FROM users
          WHERE id IN (?)
      `;

      connection.query(connectionsDetailsQuery, [connections], (err, userDetails) => {
          if (err) {
              return res.status(500).json({ error: 'Error fetching user details for connections', details: err.message });
          }

          if (userDetails.length === 0) {
              return res.status(404).json({ error: 'No users found for the connections' });
          }

          res.status(200).json({ connections: userDetails });
      });
  });
};




module.exports = { RegisterUser ,LoginUser,EditProfile,GetProfile,GetAllProfiles,SendRequest,AcceptRequest,RejectRequest,GetSentRequests,GetReceivedRequests,GetAllConnections,DeleteProfile};
