import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');

import { config } from './config/env';
import { connectDB } from './config/db';
import { errorHandler, notFound } from './middlewares/errorMiddleware';
import routes from './routes';

// Connect to MongoDB
// In serverless environments, it's often better to connect only when needed 
// or maintain a cached connection, but for this boilerplate we'll call it here.
connectDB();

const app: Application = express();
app.set('query parser', 'extended');

// Trust proxy for express-rate-limit when behind reverse proxies like Vercel
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express 5 makes req.query a getter-only property.
// xss-clean and express-mongo-sanitize try to reassign it, causing crashes.
app.use((req, res, next) => {
  const q = req.query;
  Object.defineProperty(req, 'query', {
    value: q,
    writable: true,
    enumerable: true,
    configurable: true
  });
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('tiny'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// API Routes
app.use('/api', routes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
