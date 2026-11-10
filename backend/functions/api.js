const serverless = require('serverless-http');
const app = require('../app');

// Netlify redirect delivers paths as /.netlify/functions/api/<splat>; normalise to /api/<splat>.
const handler = serverless(app);

exports.handler = async (event, context) => {
  event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '/api');
  return handler(event, context);
};

