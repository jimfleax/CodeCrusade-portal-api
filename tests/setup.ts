import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

beforeAll(async () => {
  console.log('setup: checking if connected');
  if (mongoose.connection.readyState !== 0) {
    console.log('setup: disconnecting');
    await mongoose.disconnect();
  }

  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codecrusade_test';

  // CRITICAL: Never connect tests to the production/development database.
  // Automatically derive a test database name.
  if (uri.includes('mongodb+srv')) {
    // Atlas URI: handle both with and without explicit database name
    if (uri.match(/\/[^/?]+(?:\?|$)/)) {
      uri = uri.replace(/\/([^/?]+)(?=\?|$)/, '/$1_test');
    } else {
      uri = uri.replace(/\/?(?=\?|$)/, '/test_db');
    }
  } else if (!uri.includes('test')) {
    const parts = uri.split('/');
    const dbName = parts.pop();
    uri = [...parts, dbName + '_test'].join('/');
  }

  console.log('setup: connecting to', uri);
  await mongoose.connect(uri);
  console.log('setup: connected');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
