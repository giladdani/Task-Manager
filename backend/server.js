const express = require('express');
const createError = require('http-errors');
require('dotenv').config();
const cors = require('cors');
const calendar = require('./calendar.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ignore CORS policy
app.use(cors());

// Routing
const router = express.Router();
app.use('/api', router);
router.use('/calendar', calendar);

app.use((req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))