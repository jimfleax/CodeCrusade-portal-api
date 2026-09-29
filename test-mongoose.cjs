const mongoose = require('mongoose');
const { Schema } = mongoose;
const schema = new Schema({ name: String });
const Model = mongoose.model('Test', schema);
const q = Model.find({ name: { regex: 'John', options: 'i' } });
console.log(JSON.stringify(q.getQuery()));
