const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const EventModel = require('./models/event')

const algorithm = require('./algorithm');
const router = express.Router();

// Routing
router.get('/', (req, res) => { getProjectEvents(req, res) });
router.post('/', (req, res) => { createProject(req, res) });


// Functions
const getProjectEvents = async (req, res) => {
    const allProjectEvents = await EventModel.find({});
    res.status(StatusCodes.OK).send(allProjectEvents);
}

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
                // addEventsToDB(allEventsGeneratedBySchedule); // TODO:

                if (errorMsg === null) {
                        res.status(StatusCodes.OK).send();
                } else {
                        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Database error: " + errorMsg);
                }
        } catch (err) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Unknown server error');
        }
}

module.exports = router;