const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const path = require('node:path');
const concertRoutes = require('./routes/concert.routes');
const performanceRoutes = require('./routes/performance.routes');
const imageRoutes = require('./routes/image.routes');
const artistRoutes = require('./routes/artist.routes');
const categoryRoutes = require('./routes/category.routes');
const venueRoutes = require('./routes/venue.routes');
const variantRoutes = require('./routes/variant.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const shopRoutes = require('./routes/shop.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const swaggerSpec = require('./config/swagger');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();
const logDirectory = path.resolve(__dirname, '../logs');
fs.mkdirSync(logDirectory, { recursive: true });
const accessLog = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

// credentials: true permite que el navegador envíe y reciba la cookie del JWT
const corsOptions = process.env.NODE_ENV === 'development'
  ? { origin: true, credentials: true }
  : { origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : false, credentials: true };

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLog }));
app.use(express.json());
app.use(cookieParser());

app.get(['/health', '/api/health'], (req, res) => {
  return res.status(200).json({ ok: true, success: true, message: 'API funcionando' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/concerts', concertRoutes);
app.use('/api/performances', performanceRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    errors: []
  });
});

app.use(errorHandler);

module.exports = app;
