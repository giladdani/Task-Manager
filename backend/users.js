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

const getAccessTokenFromCode = async(code) => {
    try{
        // const {code} = req.params.code;
        const {tokens} = await utils.oauth2Client.getToken(code);
        return tokens.access_token;
    }
    catch(error){
        console.log(error);
    }
}

const getEmailFromAccessToken = async(accessToken) => {
    try {
        const res = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        // const data = await res.json();
        return res.data.email;
    }
    catch (err) {
        console.log(err);
    }
}

module.exports = router;