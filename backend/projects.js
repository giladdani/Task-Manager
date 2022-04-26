const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;

const algorithm = require('./algorithm');

const router = express.Router();

// Routing
router.post('/', (req, res) => { createProject(req, res) });


// Functions
const createProject = async (req, res) => {
        try {
                // Send to algorithm
                const events = await algorithm.generateSchedule(req);

                // Add to database
                // const docs = await DayConstraintModel.DayConstraint.create(dayConstraint, (a, b) => {}); // TODO:

                // Send OK
                res.status(StatusCodes.OK).send('Project added');
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}