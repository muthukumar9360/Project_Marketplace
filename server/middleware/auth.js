const Setting = require('../models/Setting');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  // Basic Auth
  if (authHeader.startsWith('Basic ')) {
    const b64auth = authHeader.split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    try {
      const settings = await Setting.findOne({ globalId: 'global' });
      const adminUsername = settings?.adminUsername || 'muthukumar_9360';
      const adminPassword = settings?.adminPassword || 'Muthukumar@9360';

      if (login === adminUsername && password === adminPassword) {
        return next();
      }
    } catch (e) {
      return res.status(500).json({ error: 'Database error during auth' });
    }
  }
  
  res.status(401).json({ error: 'Access denied' });
};

module.exports = authMiddleware;
