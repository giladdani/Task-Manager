const consts = require('./consts.js')

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

const fetchConstraints = async () => {
    let res = null;

    try {
        const response = await fetch(`${consts.host}/constraints`, {
            headers: consts.standardHeaders,
            method: 'GET'
        });

        if (response.status !== 200) {
            throw new Error('Error while fetching constraints');
        }

        const data = await response.json();

        res = data;
    }
    catch (err) {
        console.error(err);
    }

    return res;
}

async function updateConstraint(partialConstraintEvent) {
    let response = null;
    let connectionError = null;
    console.log(`[ConstraintsAPI - updateConstraint] Updating constraint ${partialConstraintEvent.title}`);

    try {
        const body = {
            days: partialConstraintEvent.days,
            forbiddenStartDate: partialConstraintEvent.forbiddenStartDate,
            forbiddenEndDate: partialConstraintEvent.forbiddenEndDate,
            title: partialConstraintEvent.title,
        };

        response = await fetch(`http://localhost:3001/api/constraints/${partialConstraintEvent.id}`, {
            headers: consts.standardHeaders,
            method: 'PUT',
            body: JSON.stringify(body),
        });

        if (response.status !== 200) {
            console.error(`[ConstraintsAPI - updateConstraint] Server failed to update constraint ${partialConstraintEvent.title}.`);
        } else {
            console.log(`[ConstraintsAPI - updateConstraint] Constraint updated successfully: ${partialConstraintEvent.title}.`);
        }
    }
    catch (err) {
        console.error(err);
        connectionError = err;

        // ! CONSIDER: response.status == // SOME ERROR CODE, find out
    }

    return [response, connectionError];
}

async function deleteConstraint(constraintID) {
    let response = null;
    let error = null;
    console.log(`[ConstraintsAPI - deleteConstraint] Deleting constraint (ID: ${constraintID})`);

    try {
        response = await fetch(`http://localhost:3001/api/constraints/${constraintID}`, {
            headers: consts.standardHeaders,
            method: 'DELETE',
        });

        if (response.status !== 200) {
            console.error(`[ConstraintsAPI - deleteConstraint] Server failed to delete constraint (ID: ${constraintID}).`);
        } else {
            console.log(`[ConstraintsAPI - deleteConstraint] Constraint deleted successfully (ID: ${constraintID}).`);
        }
    }
    catch (err) {
        console.error(err);
        error = err;
    }

    return [response, error];
}

module.exports = {
    createConstraint: createConstraint,
    fetchConstraints: fetchConstraints,
    updateConstraint: updateConstraint,
    deleteConstraint: deleteConstraint,
}