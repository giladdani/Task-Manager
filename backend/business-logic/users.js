const express = require('express');
const StatusCodes = require('http-status-codes').StatusCodes;
const router = express.Router();
const utils = require('../utils/utils.js');
const UserModel = require('../models/user');
const googleSync = require('../utils/google-sync');


router.post('/', (req, res) => { createUserDataFromCode(req, res) });
router.get('/avatar', (req, res) => { getUserAvatarFromAccessToken(req, res) });

const createUserDataFromCode = async (req, res) => {
    try {
        const accessToken = await utils.getAccessTokenFromCode(req.body.code);
        const email = await utils.getEmailFromAccessToken(accessToken);
        console.log(`[createUserDataFromCode] ${email} performing login.`)
        const query = { email: email };
        const update = { $set: { email: email } };
        const options = { upsert: true };
        await UserModel.updateOne(query, update, options);
        await googleSync.syncGoogleData(accessToken, email);
        console.log(`[createUserDataFromCode] ${email} finished login.`)
        res.send({ email: email, accessToken: accessToken });
    }
    catch (err) {
        console.error(`[createUserDataFromCode] Failed to login`);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
}

const getUserAvatarFromAccessToken = async (req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    const avatarUrl = await utils.getAvatarUrlFromAccessToken(accessToken);
    res.send({ avatarUrl: avatarUrl });
}

module.exports = router