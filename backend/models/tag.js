const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema({
    title: String,
    email: String,
    id: String,
    color: String,
})

const Tag = mongoose.model('ConstraintEvent', tagSchema);
module.exports = Tag;