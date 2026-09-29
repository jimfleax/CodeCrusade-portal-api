const mongoSanitize = require('express-mongo-sanitize');
const req = { query: { name: { $regex: 'John', $options: 'i' } } };
mongoSanitize()(req, {}, () => {});
console.log(req.query);
