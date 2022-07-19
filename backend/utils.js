const {google} = require('googleapis');
const GOOGLE_CLIENT_ID = '255089907729-d285lq0bfp7kjhpt99m03a3sktpsva5i.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'http://localhost:3000');
const axios = require('axios').default;

const getAccessTokenFromRequest = (req) => {
    return req.headers['access_token'].slice(req.headers['access_token'].lastIndexOf(' ')+1);
}

const getEmailFromReq = async(req) => {
    const accessToken = await getAccessTokenFromRequest(req);
    return getEmailFromAccessToken(accessToken);
}

const getAccessTokenFromCode = async(code) => {
    try{
        const {tokens} = await oauth2Client.getToken(code);
        return tokens.access_token;
    }
    catch(error){
        console.log(error);
    }
}

const getEmailFromAccessToken = async(accessToken) => {
    let email = null;
    try {
        const res = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
<<<<<<< HEAD
        return res.data.email;
=======
        // const data = await res.json();
        email = res.data.email;
>>>>>>> 1a00ccad8c9f27ac977919180b8ad8c774d2b65d
    }
    catch (err) {
        console.log(err);
    }

    return email;
}

module.exports = {
    oauth2Client: oauth2Client,
    getAccessTokenFromRequest: getAccessTokenFromRequest,
    getEmailFromReq: getEmailFromReq,
    getAccessTokenFromCode: getAccessTokenFromCode,
    getEmailFromAccessToken: getEmailFromAccessToken,
}