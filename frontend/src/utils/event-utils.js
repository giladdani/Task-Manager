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
    let independentTagsIds = fc_GetIndependentTagsIds(fcEvent);
    let projectTagIds = fc_GetProjectTagIds(fcEvent);
    let ignoredProjectTagIds = fc_GetIgnoredProjectTagIds(fcEvent);

    return [independentTagsIds, projectTagIds, ignoredProjectTagIds];
}


function fc_GetIndependentTagsIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;

    return fcEvent.extendedProps.independentTagIds;
}

function fc_GetProjectTagIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;

    return fcEvent.extendedProps.projectTagIds;
}

function fc_GetIgnoredProjectTagIds(fcEvent) {
    if (!fcEvent) return null;
    if (!fcEvent.extendedProps) return null;

    return fcEvent.extendedProps.ignoredProjectTagIds;
}

/**
 * @returns [independentTagIds, projectTagIds, ignoredProjectTagIds], null if they don't exist.
 */
function g_GetAllTagsIds(gEvent) {
    let independentTagIds = g_GetTagIdsByField(gEvent, 'independentTagIdsString');
    let projectTagIds = g_GetTagIdsByField(gEvent, 'projectTagIdsString');
    let ignoredProjectTagIds = g_GetTagIdsByField(gEvent, 'ignoredProjectTagIdsString');

    return [independentTagIds, projectTagIds, ignoredProjectTagIds];
}

function g_GetTagIdsByField(gEvent, fieldName) {
    if (!gEvent) return null;
    if (!gEvent.extendedProperties) return null;
    if (!gEvent.extendedProperties.private) return null;
    if (!gEvent.extendedProperties.private[fieldName]) return null;

    let res = gEvent.extendedProperties.private[fieldName].split(",");

    return res;
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

    g_GetAllTagsIds: g_GetAllTagsIds,
    fc_GetAllTagIds: fc_GetAllTagIds,
    fc_GetProjectTagIds: fc_GetProjectTagIds,

    g_getProjectId: g_getProjectId,
    g_getAppEventId: g_getAppEventId,
}