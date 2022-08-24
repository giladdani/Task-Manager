const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js')

const basicValidStatus = [200];
const validStatusArr_createTag = basicValidStatus;


async function createTag(title) {
    const body = {
        title: title,
    }

    const response = await fetch(`${consts.host}/tags`, {
        headers: consts.standardHeaders,
        method: 'POST',
        body: JSON.stringify(body),
    });

    return response;
}

/**
 * 
 * @returns All the tags associated with the user.
 */
const fetchTagsData = async () => {
    console.log(`[TagsAPI - fetchTagsData] Fetching tags data`);

    let dataPromise = fetchTagsRes()
        .then(response => {
            return apiUtils.getResData(response);
        })

    console.log(`[TagsAPI - fetchTagsData] Returning promise.`);

    return dataPromise;
}

const fetchTagsRes = async () => {
    console.log(`[TagsAPI - fetchTagsRes] Fetching tags response.`);

    const response = fetch(`${consts.host}/tags`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    console.log(`[TagsAPI - fetchTagsRes] After server call, returning promise.`);

    return response;
}

// // async function updateConstraint(partialConstraintEvent) {
// //     console.log(`[TagsAPI - updateConstraint] Updating constraint ${partialConstraintEvent.title}`);

// //     const body = {
// //         days: partialConstraintEvent.days,
// //         forbiddenStartDate: partialConstraintEvent.forbiddenStartDate,
// //         forbiddenEndDate: partialConstraintEvent.forbiddenEndDate,
// //         title: partialConstraintEvent.title,
// //     };

// //     let responsePromise = fetch(`http://localhost:3001/api/tags/${partialConstraintEvent.id}`, {
// //         headers: consts.standardHeaders,
// //         method: 'PUT',
// //         body: JSON.stringify(body),
// //     });

// //     console.log(`[TagsAPI - updateConstraint] After server call, returning promise.`);

// //     return responsePromise;
// // }

async function deleteTag(tagId) {
    console.log(`[TagsAPI - deleteTag] Deleting tag (ID: ${tagId})`);

    let responsePromise = fetch(`http://localhost:3001/api/tags/${tagId}`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
    });

    console.log(`[TagsAPI - deleteTag] After server call, returning promise.`);

    return responsePromise;
}

module.exports = {
    validStatusArr_createTag: validStatusArr_createTag,
    
    createTag: createTag,
    fetchTagsData: fetchTagsData,
    fetchTagsRes: fetchTagsRes,
    deleteTag: deleteTag,
}