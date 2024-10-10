const jwt = require('jsonwebtoken');

// Middleware para autenticação via JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Autenticação necessária' });
  }
};

module.exports = authenticateJWT;
