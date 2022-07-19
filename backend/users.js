const express = require('express');
const router = express.Router();
const utils = require('./utils');

router.post('/', (req, res) => { createUserDataFromCode(req, res) });

const createUserDataFromCode = async (req, res) =>{
    const accessToken = await utils.getAccessTokenFromCode(req.body.code);
    const email = await utils.getEmailFromAccessToken(accessToken);
    res.send({email: email, accessToken: accessToken});
}

module.exports = router