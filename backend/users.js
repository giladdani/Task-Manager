const express = require('express');
const router = express.Router();
const utils = require('./utils');
const axios = require('axios').default;

router.post('/', (req, res) => { createUserDataFromCode(req, res) });

const createUserDataFromCode = async (req, res) =>{
    const accessToken = await getAccessTokenFromCode(req.body.code);
    const email = await getEmailFromAccessToken(accessToken);
    res.send({email: email, accessToken: accessToken});
}

module.exports = router