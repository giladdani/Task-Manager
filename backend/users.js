const express = require('express');
const router = express.Router();
const utils = require('./utils');
const UserModel = require('./models/user');
const googleSync = require('./google-sync');


router.post('/', (req, res) => { createUserDataFromCode(req, res) });
router.get('/avatar', (req, res) => { getUserAvatarFromAccessToken(req, res) });

const createUserDataFromCode = async (req, res) => {
    const accessToken = await utils.getAccessTokenFromCode(req.body.code);
    const email = await utils.getEmailFromAccessToken(accessToken);
    const query = { email: email };
    const update = { $set: { email: email } };
    const options = { upsert: true };
    await UserModel.updateOne(query, update, options);
    await googleSync.resetEventsFetchStatus(email);
    await googleSync.syncGoogleData(accessToken, email);

    res.send({ email: email, accessToken: accessToken });
}

const getUserAvatarFromAccessToken = async (req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    const avatarUrl = await utils.getAvatarUrlFromAccessToken(accessToken);
    res.send({ avatarUrl: avatarUrl });
}

module.exports = router