const jwt = require('jsonwebtoken')

const generateToken = (userId) =>{
    return jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'5d'})
}

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
  
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      req.userId = decoded.userId; 
  
      next();
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }
  };

module.exports = {generateToken,verifyToken}