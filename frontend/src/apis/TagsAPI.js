const consts = require('./consts.js')
const apiUtils = require('./APIUtils.js')

const basicValidStatus = [200];
const validStatusArr_createTag = basicValidStatus;
const validStatusArr_deleteTags = basicValidStatus;


async function createTag(title) {
    const body = {
        title: title,
    }

    const response = await fetch(`${consts.fullRouteTags}`, {
        headers: consts.standardHeaders,
        method: 'POST',
        body: JSON.stringify(body),
    });

    return response;
}

async function getTagsDataByIds(ids) {
    let dataPromise = getTagsResByIds(ids)
        .then(response => {
            return apiUtils.getResData(response);
        })

    console.log(`[TagsAPI - fetchTagsData] Returning promise.`);

    return dataPromise;
}

async function getTagsResByIds(ids) {
    if (!ids || ids.length === 0) {
        return null;
    }
    
    const response = fetch(`${consts.fullRouteTags}/${ids}`, {
        headers: consts.standardHeaders,
        method: 'GET'
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

    const response = fetch(`${consts.fullRouteTags}`, {
        headers: consts.standardHeaders,
        method: 'GET'
    });

    console.log(`[TagsAPI - fetchTagsRes] After server call, returning promise.`);

    return response;
}

async function deleteTag(tagId) {
    console.log(`[TagsAPI - deleteTag] Deleting tag (ID: ${tagId})`);

    let responsePromise = fetch(`${consts.fullRouteTags}/${tagId}`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
    });

    console.log(`[TagsAPI - deleteTag] After server call, returning promise.`);

    return responsePromise;
}

async function deleteTags(arrTagIds) {
    console.log(`[TagsAPI - deleteTags] Deleting tags`);

    if (!arrTagIds || arrTagIds.length === 0) {
        return null;
    }

    let responsePromise = fetch(`${consts.fullRouteTags}/many/${arrTagIds}`, {
        headers: consts.standardHeaders,
        method: 'DELETE',
    });

    console.log(`[TagsAPI - deleteTags] After server call, returning promise.`);

    return responsePromise;
}

module.exports = {
    validStatusArr_createTag: validStatusArr_createTag,
    validStatusArr_deleteTags: validStatusArr_deleteTags,

    createTag: createTag,
    getTagsDataByIds: getTagsDataByIds,
    fetchTagsData: fetchTagsData,
    fetchTagsRes: fetchTagsRes,
    deleteTag: deleteTag,
    deleteTags: deleteTags,
}