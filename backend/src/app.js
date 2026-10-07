const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const path = require('node:path');
const concertRoutes = require('./routes/concert.routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();
const logDirectory = path.resolve(__dirname, '../logs');
fs.mkdirSync(logDirectory, { recursive: true });
const accessLog = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

const corsOptions = process.env.NODE_ENV === 'development'
  ? { origin: true }
  : { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : false };

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLog }));
app.use(express.json());

app.get(['/health', '/api/health'], (req, res) => {
  return res.status(200).json({ ok: true, success: true, message: 'API funcionando' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/concerts', concertRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errors: []
  });
});

app.use(errorHandler);

module.exports = app;
