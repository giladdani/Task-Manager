function isSharedProject(project) {
    if (!project) return false;

    return project.participatingEmails.length > 1;
}

module.exports = {
    isSharedProject: isSharedProject,
}