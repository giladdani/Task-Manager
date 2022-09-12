const googleAccessRole = {
    none: 'none',
    freeBusyReader: 'freeBusyReader',
    reader: 'reader',
    writer: 'writer',
    owner: 'owner',
}

const noPermissionMsg = "No permission to modify this event.";

function fc_accessRoleAllowsWriting(fcEvent) {
    if (!fcEvent) {
        return false;
    }

    if (!fcEvent.extendedProps) {
        // If there are no extended props, then there's no mention of access role. 
        // By default that means there is permission.
        return true;
    }

    let accessRole = fcEvent.extendedProps.accessRole;

    if (!accessRole) {
        return true;
    }

    return accessRole === googleAccessRole.writer || accessRole === googleAccessRole.owner;
}

function g_accessRoleAllowsWriting(gEvent) {
    if (!gEvent) {
        return false;
    }

    let accessRole = gEvent.accessRole;

    if (!accessRole) {
        return false;
    }

    return accessRole === googleAccessRole.writer || accessRole === googleAccessRole.owner;
}

function isConstraintEvent(event) {
    if (!event) {
        return false;
    }
    if (!event.extendedProps || !event.extendedProps.isConstraint) {
        return false;
    }

    return event.extendedProps.isConstraint;
}

function isGoogleEvent(event) {
    if (!event) {
        return false;
    }
    if (!event.extendedProps || !event.extendedProps.isGoogleEvent) {
        return false;
    }

    return event.extendedProps.isGoogleEvent;
}

/**
 * @returns [independentTagsIds, projectTagIds, ignoredProjectTagIds], null if they don't exist.
 */
function fc_GetAllTagIds(fcEvent) {
    let independentTagsIds = fc_GetTagByField(fcEvent, "independentTagIds");
    let projectTagIds = fc_GetTagByField(fcEvent, "projectTagIds");
    let ignoredProjectTagIds = fc_GetTagByField(fcEvent, "ignoredProjectTagIds");

    return [independentTagsIds, projectTagIds, ignoredProjectTagIds];
}

function fc_GetActiveTagIds(fcEvent) {
    let allTagIds = [];
    let independentTagsIds = fc_GetTagByField(fcEvent, "independentTagIds");
    let projectTagIds = fc_GetTagByField(fcEvent, "projectTagIds");
    if (independentTagsIds != null) {
        allTagIds = independentTagsIds.concat(projectTagIds);
    }

    return allTagIds;
}

function fc_GetTagByField(fcEvent, fieldName) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;
    if (!fcEvent.extendedProps.tags) return null;

    return fcEvent.extendedProps.tags[fieldName];
}


function fc_GetIndependentTagsIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;

    return fcEvent.extendedProps.independentTagIds;
}

function fc_GetProjectTagIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;
    if (!fcEvent.extendedProps.tags) return null;

    return fcEvent.extendedProps.tags.projectTagIds;
}

function fc_GetIgnoredProjectTagIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;

    return fcEvent.extendedProps.ignoredProjectTagIds;
}

/**
 * @returns [independentTagsIds, projectTagIds, ignoredProjectTagIds], null if they don't exist.
 */
function unex_GetAllTagIds(unexEvent) {
    let independentTagsIds = unex_GetTagsByField(unexEvent, 'independentTagIds');
    let projectTagIds = unex_GetTagsByField(unexEvent, 'projectTagIds');
    let ignoredProjectTagIds = unex_GetTagsByField(unexEvent, 'ignoredProjectTagIds');

    return [independentTagsIds, projectTagIds, ignoredProjectTagIds];
}

function unex_GetTagsByField(unexEvent, fieldName) {
    if (!unexEvent) return null;
    if (!unexEvent.tags) return null;
    return unexEvent.tags[fieldName];
}

/**
 * @returns tag object with the fields: {independentTagIds, projectTagIds, ignoredProjectTagIds}
 */
function g_GetAllTagsIds(gEvent) {
    let independentTagIds = g_GetTagIdsByField(gEvent, 'independentTagIds');
    let projectTagIds = g_GetTagIdsByField(gEvent, 'projectTagIds');
    let ignoredProjectTagIds = g_GetTagIdsByField(gEvent, 'ignoredProjectTagIds');

    let tags = {
        independentTagIds: independentTagIds,
        projectTagIds: projectTagIds,
        ignoredProjectTagIds: ignoredProjectTagIds,
    }

    return tags;
}

function g_GetTagIdsByField(gEvent, fieldName) {
    if (!gEvent) return null;
    if (!gEvent.tags) return null;
    return gEvent.tags[fieldName];

    // ! DELETE if all works well Old version, where tags were saved in extended properties
    // // if (!gEvent) return null;
    // // if (!gEvent.extendedProperties) return null;
    // // if (!gEvent.extendedProperties.private) return null;
    // // return gEvent.extendedProperties.private[fieldName];


    // ! DELETE if all works - old code from when we saved google events in our DB wtih String in extended properties, not arrayss (to match Google resource which accepts only strings)
    // if (!gEvent.extendedProperties.private[fieldName]) return null;

    // let res = gEvent.extendedProperties.private[fieldName].split(",");

    // return res;
}




// // /**
// //  * @returns [independentTagsIds, projectTagIds, ignoredProjectTagIds], null if they don't exist.
// //  */
// //  function g_GetAllTagsIds(gEvent) {
// //     let independentTagsIds = g_GetIndependentTagsIds(gEvent);
// //     let projectTagIds = g_GetProjectTagIds(gEvent);
// //     let ignoredProjectTagIds = g_GetIgnoredProjectTagIds(gEvent);

// //     return [independentTagsIds, projectTagIds, ignoredProjectTagIds];
// // }

// // function g_GetIndependentTagsIds(gEvent) {
// //     if (!gEvent) return null;
// //     if (!gEvent.extendedProperties) return null;
// //     if (!gEvent.extendedProperties.private) return null;
// //     if (!gEvent.extendedProperties.private.independentTagIdsString) return null;

// //     let res = gEvent.extendedProperties.private.independentTagIdsString.split(",");

// //     return res;
// // }

// // function g_GetProjectTagIds(gEvent) {
// //     if (!gEvent) return null;
// //     if (!gEvent.extendedProperties) return null;
// //     if (!gEvent.extendedProperties.private) return null;

// //     return gEvent.extendedProperties.private.projectTagIds;
// // }

// // function g_GetIgnoredProjectTagIds(gEvent) {
// //     if (!gEvent) return null;
// //     if (!gEvent.extendedProperties) return null;
// //     if (!gEvent.extendedProperties.private) return null;

// //     return gEvent.extendedProperties.private.ignoredProjectTagIds;
// // }








function fc_isProjectEvent(fcEvent) {
    if (!fcEvent) {
        return false;
    }

    if (fcEvent.projectId) {
        return fcEvent.projectId !== null;
    }

    if (!fcEvent.extendedProps) {
        return false;
    }

    if (!fcEvent.extendedProps.projectId) {
        return false;
    }

    let isProjectEvent = fcEvent.extendedProps.projectId !== null;

    return isProjectEvent;
}

function g_getProjectId(gEvent) {
    if (!gEvent) {
        return null;
    }

    if (!gEvent.extendedProperties) {
        return null;
    }

    if (!gEvent.extendedProperties.private) {
        return null;
    }

    return gEvent.extendedProperties.private.fullCalendarProjectId;
}


/**
 * TODO:
 * Perhaps we need to give up the local IDs, and stay only with Google IDs?
 */
/**
 * @returns the local ID given to the event by the application. 
 * If no such ID exists (e.g. if it's solely a Google event), the Google ID is returned.
 */
function g_getAppEventId(gEvent) {
    if (!gEvent) {
        return null;
    }

    let id = gEvent.id;
    if (!gEvent.extendedProperties) {
        return id;
    }

    if (!gEvent.extendedProperties.private) {
        return id;
    }

    if (!gEvent.extendedProperties.private.fullCalendarEventID) {
        return id;
    }

    return gEvent.extendedProperties.private.fullCalendarEventID;
}

/**
 * Returns the end date of a database event, whether Google or Unexported.
 * @param {*} event 
 */
const db_GetEventEndDate = (event) => {
    let date = null;

    /**
    * We need to perform this check because Google's event resource is different than FullCalendar's when it comes to saving the time.
    * Google saves under "end" and "start" two fields "date" and "dateTime".
    * FullCalendar just uses "end" and "start".
     */
    if (event.isGoogleEvent) {
        date = new Date(event.end.dateTime)
    } else {
        date = new Date(event.end);
    }

    return date;
}

/**
 * Returns the start date of a database event, whether Google or Unexported.
 * @param {*} event 
 */
 const db_GetEventStartDate = (event) => {
    let date = null;

    /**
    * We need to perform this check because Google's event resource is different than FullCalendar's when it comes to saving the time.
    * Google saves under "end" and "start" two fields "date" and "dateTime".
    * FullCalendar just uses "end" and "start".
     */
    if (event.isGoogleEvent) {
        date = new Date(event.start.dateTime)
    } else {
        date = new Date(event.start);
    }

    return date;
}

/**
 * Returns true if the event is a Google event.
 * @param {*} dbEvent An event from the server's database.
 * @returns 
 */
const db_IsGoogleEvent = (dbEvent) => {
    return dbEvent.isGoogleEvent;
}



/**
 * Google objects and unexported objects are structured differently in our DB.
 * We use prefixes with functions to determine what sort of object they deal with:
 * * "g_" for Google event
 * * "fc_" for Full Calendar event
 * * "unex_" for unexported event from the DB.
 */
module.exports = {
    noPermissionMsg: noPermissionMsg,

    fc_accessRoleAllowsWriting: fc_accessRoleAllowsWriting,
    g_accessRoleAllowsWriting: g_accessRoleAllowsWriting,
    isConstraintEvent: isConstraintEvent,
    isGoogleEvent: isGoogleEvent,

    fc_isProjectEvent: fc_isProjectEvent,

    unex_GetAllTagIds: unex_GetAllTagIds,
    g_GetAllTagsIds: g_GetAllTagsIds,
    fc_GetAllTagIds: fc_GetAllTagIds,
    fc_GetProjectTagIds: fc_GetProjectTagIds,
    fc_GetActiveTagIds: fc_GetActiveTagIds,

    g_getProjectId: g_getProjectId,
    g_getAppEventId: g_getAppEventId,

    db_GetEventEndDate: db_GetEventEndDate,
    db_GetEventStartDate: db_GetEventStartDate,
    db_IsGoogleEvent: db_IsGoogleEvent,
}