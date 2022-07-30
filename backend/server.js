const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config({path:__dirname+'/.env'})
const createError = require('http-errors');

// Local files
const calendar = require('./calendar');
const users = require('./users');
const constraints = require('./constraints');
const projects = require('./projects');

// Constants
const DbUri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@task-manager.sh855.mongodb.net/TaskManager?retryWrites=true&w=majority`
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ignore CORS policy
app.use(cors());

// Routing
const router = express.Router();
app.use('/api', router);
router.use('/calendar', calendar);
router.use('/users', users);
router.use('/constraints', constraints);
router.use('/projects', projects);

mongoose.connect(DbUri).then(result => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => console.log(err));