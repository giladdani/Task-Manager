const mongoose  = require("mongoose");
const Schema = mongoose.Schema;

const dayConstraintSchema = new Schema({
    day: String,
    forbiddenTimeWindows: [Schema.Types.Mixed],
    // userID: Number,
    // constraintID: Number.
})


const DayConstraint = mongoose.model('DayConstraint', dayConstraintSchema);
module.exports = DayConstraint;