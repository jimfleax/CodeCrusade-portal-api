const mongoose = require('mongoose');
const query = mongoose.model('Test', new mongoose.Schema({ name: String })).find({ name: 'a' }).skip(10).limit(5);
console.log(query.getFilter());
