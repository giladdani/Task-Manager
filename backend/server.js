const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config({path:__dirname+'/.env'})
const createError = require('http-errors');

// Local files
const events = require('./business-logic/events');
const users = require('./business-logic/users');
const constraints = require('./business-logic/constraints');
const projects = require('./business-logic/projects');
const tags = require('./business-logic/tags.js');


// Constants
const DbUri = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@task-manager.sh855.mongodb.net/TaskManager?retryWrites=true&w=majority`
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allow CORS only for frontend domain
app.use(
  cors({
    origin: `${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`
  }));

// Routing
const router = express.Router();
app.use('/api', router);

router.use('/events', events);
router.use('/users', users);
router.use('/constraints', constraints);
router.use('/projects', projects);
router.use('/tags', tags);

mongoose.connect(DbUri).then(result => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}).catch((err) => console.log(err));