const express = require('express');
const dbProjects = require('../dal/dbProjects.js');
const router = express.Router();
const StatusCodes = require('http-status-codes').StatusCodes;
const dbTags = require('../dal/dbTags.js');
const utils = require('../utils/utils.js');
const eventsUtils = require('./events/events-utils.js');

// Routing
router.get('/', (req, res) => { getTags(req, res) });
router.get('/:ids', (req, res) => { getTagsByIds(req, res) });
router.post('/', (req, res) => { createTag(req, res) });
router.delete('/:id', (req, res) => { deleteTag(req, res) });
router.delete('/many/:ids', (req, res) => { deleteTagsMany(req, res) });


// Functions
const getTags = async (req, res) => {
    console.log(`[getTags]`)
    try {
        const userEmail = utils.getEmailFromReq(req);
        const tags = await dbTags.find({ 'email': userEmail });
        res.status(StatusCodes.OK).send(tags);
    } catch (err) {
        console.error(`[getTags] Error!\n${err}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const getTagsByIds = async (req, res) => {
    console.log(`[getTagsByIds]`)

    try {
        const idsString = req.params.ids;
        const ids = idsString.split(',');
        const tags = await dbTags.findByIds(ids);
        res.status(StatusCodes.OK).send(tags);
    } catch (err) {
        console.error(`[getTags] Error!\n${err}`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const createTag = async (req, res) => {
    console.log(`[createTag]`)

    try {
        const email = utils.getEmailFromReq(req);
        let title = req.body.title;

        if (!title) {
            res.status(StatusCodes.BAD_REQUEST).send("Must provide title.");
            return;
        }

        title = title.trim();
        if (title.length === 0) {
            res.status(StatusCodes.BAD_REQUEST).send("Cannot enter empty title.");
            return;
        }

        const dbTag = await dbTags.findOne({ email: email, title: title });
        if (dbTag) {
            res.status(StatusCodes.CONFLICT).send("Tag by that name already exists.");
            return;
        }

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
        console.log("[createTag] Added tag");
        res.status(StatusCodes.OK).send();
    } catch (err) {
        console.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err);
    }
}

const deleteTag = async (req, res) => {
    console.log(`[deleteTag]`)
    const tagId = req.params.id;
    let tagIds = [tagId];
    let [statusCode, resMsg] = await delateTags(tagIds, req);
    console.log(resMsg);
    res.status(statusCode).send(resMsg);
}

const deleteTagsMany = async (req, res) => {
    console.log(`[deleteTags]`)
    const idsString = req.params.ids;
    const tagIds = idsString.split(',');
    let [statusCode, resMsg] = await delateTags(tagIds, req);
    console.log(resMsg);
    res.status(statusCode).send(resMsg);
}

/**
 * 
 * @param {*} arrTagIdsToRemove An array of tag IDs to remove.
 * @returns [statusCode, msg]
 */
async function delateTags(arrTagIdsToRemove, req) {
    if (!arrTagIdsToRemove || arrTagIdsToRemove.length === 0) {
        return [StatusCodes.BAD_REQUEST, "Did not receive any tags to remove."]
    }

    let errorMsg = null;
    let statusCode = null;
    let resMsg = null;
    let email = utils.getEmailFromReq(req);
    let docs;
    try {
        docs = await dbTags.deleteTags(arrTagIdsToRemove, email);
    } catch (err) {
        errorMsg = err;
    }

    
    if (!errorMsg) {
        let accessToken = await utils.getAccessTokenFromRequest(req);
        eventsUtils.deleteTags(arrTagIdsToRemove, email, accessToken);
        dbProjects.deleteTags(arrTagIdsToRemove, email);
        resMsg = "Deleted tags.";
        statusCode = StatusCodes.OK;
    } else {
        if (docs.deletedCount === 0) {
            resMsg = "Error: Found no tag matching the IDs.";
            statusCode = StatusCodes.BAD_REQUEST;
        } else {
            resMsg = "Internal server error";
            statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        }
    }

    return [statusCode, resMsg];
}

module.exports = router;