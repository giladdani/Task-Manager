const googleAccessRole = {
    none: 'none',
    freeBusyReader: 'freeBusyReader',
    reader: 'reader',
    writer: 'writer',
    owner: 'owner',
}

const noPermissionMsg = "No permission to modify this event.";

function accessRoleAllowsWritingFCEvent(fcEvent) {
    if (!fcEvent) {
        return false;
    }

    if (!fcEvent.extendedProps) {
        return false;
    }

    let accessRole = fcEvent.extendedProps.accessRole;

    if (!accessRole) {
        return false;
    }

    return accessRole === googleAccessRole.writer || accessRole === googleAccessRole.owner;
}

function accessRoleAllowsWritingGEvent(gEvent) {
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

module.exports = {
    noPermissionMsg: noPermissionMsg,
    accessRoleAllowsWritingFCEvent: accessRoleAllowsWritingFCEvent,
    accessRoleAllowsWritingGEvent: accessRoleAllowsWritingGEvent,
    isConstraintEvent: isConstraintEvent,
}