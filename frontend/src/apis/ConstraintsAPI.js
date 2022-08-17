const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js')

const basicValidStatus = [200];
const deleteValidStatusArr = basicValidStatus;
const updateValidStatusArr = basicValidStatus;
const createValidStatusArr = basicValidStatus;

async function createConstraint(body) {
    let response = null;
    let error = null;
    console.log(`[ConstraintsAPI - createConstraint] Creaing constraint.`);

    try {
        response = await fetch('http://localhost:3001/api/constraints', {
            headers: consts.standardHeaders,
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (response.status !== 200) {
            console.error(`[ConstraintsAPI - createConstraint] Server failed to create constraint.`);
        } else {
            console.log(`[ConstraintsAPI - createConstraint] Constraint updated successfully.`);
        }
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [response, error];
}

const fetchConstraintsData = async () => {
    console.log(`[ConstraintsAPI - fetchConstraintsData] Fetching constraints data`);

    let dataPromise = fetchConstraintsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    console.log(`[ConstraintsAPI - fetchConstraintsData] Returning promise.`);

    return dataPromise;
}

const fetchConstraintsRes = async () => {
    console.log(`[ConstraintsAPI - fetchConstraintsRes] Fetching constraints response.`);

    const response = fetch(`${consts.host}/constraints`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    console.log(`[ConstraintsAPI - fetchConstraintsRes] After server call, returning promise.`);

    return response;
}

async function updateConstraint(partialConstraintEvent) {
    console.log(`[ConstraintsAPI - updateConstraint] Updating constraint ${partialConstraintEvent.title}`);

    const body = {
        days: partialConstraintEvent.days,
        forbiddenStartDate: partialConstraintEvent.forbiddenStartDate,
        forbiddenEndDate: partialConstraintEvent.forbiddenEndDate,
        title: partialConstraintEvent.title,
    };

    let responsePromise = fetch(`http://localhost:3001/api/constraints/${partialConstraintEvent.id}`, {
        headers: consts.standardHeaders,
        method: 'PUT',
        body: JSON.stringify(body),
    });

    console.log(`[ConstraintsAPI - updateConstraint] After server call, returning promise.`);

    return responsePromise;
}

async function deleteConstraint(constraintID) {
    console.log(`[ConstraintsAPI - deleteConstraint] Deleting constraint (ID: ${constraintID})`);

    let responsePromise = fetch(`http://localhost:3001/api/constraints/${constraintID}`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
    });

    console.log(`[ConstraintsAPI - deleteConstraint] After server call, returning promise.`);

    return responsePromise;
}

module.exports = {
    deleteValidStatusArr: deleteValidStatusArr,
    updateValidStatusArr: updateValidStatusArr,
    createValidStatusArr: createValidStatusArr,

    createConstraint: createConstraint,
    fetchConstraintsRes: fetchConstraintsRes,
    fetchConstraintsData: fetchConstraintsData,
    updateConstraint: updateConstraint,
    deleteConstraint: deleteConstraint,
}