import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');

import { config } from './config/env';
import { connectDB } from './config/db';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import routes from './routes';

// Global DB Connection Middleware
const app: Application = express();

app.set('query parser', 'extended');

// Trust proxy for express-rate-limit when behind reverse proxies like Vercel
app.set('trust proxy', 1);

// CORS — MUST be the absolute first middleware so OPTIONS preflight
// requests are answered immediately without waiting for DB connection
const corsOptions = {
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// DB connection — runs after CORS so preflights never block on cold starts
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure req.body is never undefined to prevent destructuring crashes
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});

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
