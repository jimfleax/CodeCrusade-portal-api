import mongoose from 'mongoose';
import dotenv from 'dotenv';
import supertest from 'supertest';
import app from './src/app';
import { authService } from './src/services/authService';
import StaffUser from './src/models/StaffUser';

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');
  
  // Create a dummy user
  await StaffUser.deleteMany({ email: 'testme@test.com' });
  const user = await StaffUser.create({
    name: 'Test',
    email: 'testme@test.com',
    passwordHash: 'hash', // fake
    role: 'COORDINATOR'
  });
  
  // Create token
  const token = require('jsonwebtoken').sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  const res = await supertest(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
    
  console.log("Status:", res.status);
  console.log("Body:", res.body);
  
  await mongoose.disconnect();
})();
