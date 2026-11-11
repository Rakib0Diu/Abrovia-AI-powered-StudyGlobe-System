const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const countriesRoutes = require('./routes/countries');
const universitiesRoutes = require('./routes/universities');
const programsRoutes = require('./routes/programs');
const intakesRoutes = require('./routes/intakes');
const languageRequirementsRoutes = require('./routes/languageRequirements');
const scholarshipsRoutes = require('./routes/scholarships');

const app = express();

const allowedOrigins = ['http://localhost:3000', process.env.CLIENT_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: false,
  })
);

app.use(express.json({ limit: '1mb' }));

const api = express.Router();

api.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

api.use('/auth', authRoutes);
api.use('/profile', profileRoutes);
api.use('/countries', countriesRoutes);
api.use('/universities', universitiesRoutes);
api.use('/programs', programsRoutes);
api.use('/intakes', intakesRoutes);
api.use('/language-requirements', languageRequirementsRoutes);
api.use('/scholarships', scholarshipsRoutes);


app.use('/api', api);
app.use('/', api);


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.error(err);

  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message || 'Request failed';
  const payload = { error: message };

  if (err.details && status !== 500) {
    payload.details = err.details;
  }

  return res.status(status).json(payload);
});

module.exports = app;
