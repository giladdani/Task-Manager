const express = require('express');
const router = express.Router();
const utils = require('./utils');

router.post('/', (req, res) => { createUserDataFromCode(req, res) });
router.get('/avatar', (req, res) => { getUserAvatarFromAccessToken(req, res) });

const createUserDataFromCode = async(req, res) => {
    const accessToken = await utils.getAccessTokenFromCode(req.body.code);
    const email = await utils.getEmailFromAccessToken(accessToken);
    res.send({email: email, accessToken: accessToken});
}

const getUserAvatarFromAccessToken = async(req, res) => {
    const accessToken = utils.getAccessTokenFromRequest(req);
    const avatarUrl = await utils.getAvatarUrlFromAccessToken(accessToken);
    res.send({avatarUrl: avatarUrl});
}

module.exports = router