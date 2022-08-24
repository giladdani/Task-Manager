const express = require('express');
const router = express.Router();
const StatusCodes = require('http-status-codes').StatusCodes;
const dbTags = require('../dal/dbTags.js');
const utils = require('../utils/utils.js');

// Routing
router.get('/', (req, res) => { getTags(req, res) });
router.post('/', (req, res) => { createTag(req, res) });
router.delete('/:id', (req, res) => { deleteTag(req, res) });


// Functions
const getTags = async (req, res) => {
    try {
        const userEmail = utils.getEmailFromReq(req);
        const allConstraints = await dbTags.find({ 'email': userEmail });
        res.status(StatusCodes.OK).send(allConstraints);
    } catch (err) {
        console.error(`[getTags] Error!\n${err}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const createTag = async (req, res) => {
    try {
        const email = utils.getEmailFromReq(req);
        const title = req.body.title;
        let color = req.body.color;
        if (!color) {
            color = utils.getRandomColor();
        }
        const id = utils.generateId();
        const tag = {
            title: title,
            email: email,
            id: id,
            color: color,
        }

        const docs = await dbTags.create(tag);

        // TODO: check docs response?
        console.log("[createTag] Added tag");
        res.status(StatusCodes.OK).send();
    } catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const deleteTag = async (req, res) => {
    let statusCode = null;
    let resMsg = null;
    let errorMsg = null;
    const tagId = req.params.id;
    let docs;
    try {
        docs = await dbTags.deleteOne({ 'id': tagId })
    } catch (err) {
        errorMsg = err;
    }

    if (errorMsg === null) {
        if (docs.deletedCount === 0) {
            resMsg = "Error: Found no tag matching that ID.";
            statusCode = StatusCodes.BAD_REQUEST;
        } else {
            resMsg = "Deleted tag " + tagId;
            statusCode = StatusCodes.OK;

            // Remove tag from all unexported events
            // Remove tag from all google events
            // Remove tag from all projects
        }
    } else {
        resMsg = errorMsg;
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    }

    console.log(resMsg);
    res.status(statusCode).send(resMsg);
}

module.exports = router;