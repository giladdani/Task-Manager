const express = require('express');
const {google} = require('googleapis');
const User = require('./models/user');

const router = express.Router();

// Routing
router.get('/:username', (req, res) => { get_user_refresh_token(req, res) });

// Functions
const get_user_refresh_token = async(req, res) =>{
    const name = stringHelper.capitalizeFirstLetter(req.params.name);
    const user = await User.find({ user_name: name });
    res.send(user);
}

module.exports = router;