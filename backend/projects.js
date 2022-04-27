const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/event')

const algorithm = require('./algorithm');
const router = express.Router();

// Routing
router.post('/', (req, res) => { createProject(req, res) });

// Functions
const createProject = async (req, res) => {
        try {
                const events = await algorithm.generateSchedule(req);

                let errorMsg = null;
                const docs = await EventModel.insertMany(events, (err) => {
                        if (err != null) {
                                console.error(err);
                                errorMsg = err;
                        }
                });

                if (errorMsg != null) {
                        res.status(StatusCodes.OK).send('Project added');
                } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Database error: " + errorMsg);
                }
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}

module.exports = router;