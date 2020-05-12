const request_status = {
    UNMATCHED: 0,
    MATCHED: 1,
    COMPLETED: 2
}
    
const volunteer_status = {
    PENDING: 0,
    IN_PROGRESS: 1,
    COMPLETE: 2,
    REJECTED: 3,
    DOES_NOT_EXIST: -1
}

const RequestRepository = require('../repositories/request.repository');
const AssociationService = require('./association.service');
const emailer = require('../util/emailer');
const Pusher = require('pusher');

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
});

/**
 * Generic get requests given a query
 */ 
exports.getRequests = async function(query) {
    try {
        return await RequestRepository.readRequest(query);
    } catch (e) {
        throw e;
    }
}

/**
 * Get requests for a volunteer given a particuar request status
 */
exports.getVolunteerRequests = async function(id, status) {
    const query = {
        "status.volunteers.volunteer":  id
    }
    try {
        var requests = await RequestRepository.readRequest(query); // Find all requests that contain the volunteer
        var volunteer_requests = [];
        requests.forEach(request => {
            request.status.volunteers.forEach(volunteer_obj => {
                if (volunteer_obj.volunteer === id && volunteer_obj.current_status === parseInt(status)) { // Check that the volunteer status for the desired volunteer matches the requested status
                    if (request.status.current_status === request_status.COMPLETED) { // Special case -> if a request is complete, only send it back to the volunteers who completed it
                        if (volunteer_obj.current_status === volunteer_status.COMPLETE) {
                            volunteer_requests.push(request);
                        }
                    } else {
                        volunteer_requests.push(request); // Add the request to the list of requests for this volunteer/status combo
                    }
                }
            });
        });

        return volunteer_requests;

    } catch (e) {
        throw e;
    }
}

/**
 * Create a request (whether direct or general)
 */
exports.createRequest = async function(request) {
    try {
        let new_request = request.status.volunteer ? await handleDirectMatch(request) : await handleGeneral(request); // if there is a volunteer attached to the request, create direct match. Otherwise, create general
        new_request.time_posted = new Date();
        new_request['admin_info'] = {
            last_modified_time: new Date(),
            assignee: 'No one assigned'
        }
        return await RequestRepository.createRequest(new_request);
    } catch (e) {
        console.log(e);
        throw e;
    }
}

// Construct a direct match request
async function handleDirectMatch(request) {
    let volunteer_status_obj = {
        current_status: volunteer_status.PENDING,
        volunteer: request.status.volunteer._id,
        volunteer_response: "",
        adminMessage: "",
        last_notified_time: new Date()
    }
    let volunteer_statuses = [
        volunteer_status_obj
    ]
    var volunteer = request.status.volunteer;
    request['status'] = {
        current_status: request_status.MATCHED,
        volunteers: volunteer_statuses,
        completed_reason: "",
        volunteer_quota: 1
    }

    // Prepare email/pusher notifications
    var associationEmail = 'covaidco@gmail.com'
    if (request.association) {
        let association = await AssociationService.getAssociation({'_id': request.association});
        associationEmail = association.email;
    }
    var first_name = volunteer.first_name;
    first_name = first_name.toLowerCase();
    first_name = first_name[0].toUpperCase() + first_name.slice(1);
    var data = {
        sender: "Covaid@covaid.co",
        receiver: volunteer.email,
        name: first_name,
        assoc: associationEmail,
        templateName: "volunteer_notification",
    };
    emailer.sendNotificationEmail(data);
    pusher.trigger(volunteer._id, 'direct-match', 'You have a new pending request!');
    return request;
}

// Construct a general request
async function handleGeneral(request) {
    request['status'] = {
        current_status: request_status.UNMATCHED,
        volunteers: [],
        completed_reason: "",
        volunteer_quota: 1
    }

    // Prepare email/pusher notifications
    var associationEmail = 'covaidco@gmail.com';
    var associationName = 'Covaid';
    if (request.association) {
        let association = (await AssociationService.getAssociation({'_id': request.association}))[0];
        associationEmail = association.email;
        associationName = association.name;
    }
    var data = {
        sender: "Covaid@covaid.co",
        receiver: associationEmail,
        name: request.personal_info.requester_name,
        assoc: associationName,
        templateName: "org_notification",
    };
    emailer.sendNotificationEmail(data);
    pusher.trigger(request.association, 'general', "You have a new unmatched request!");

    return request;
}

/**
 * Match a list of volunteers to a request
 */
exports.matchVolunteers = async function(requestID, volunteers, adminMessage) {
    try {
        let request = (await RequestRepository.readRequest({_id: requestID}))[0]; // Find the relevant request

        // Given volunteer list, attach the volunteer as Pending if the volunteer does not already exist in the list (Will skip over volunteers who previously rejected a request)
        let new_volunteers = volunteers.map(function (volunteer_id) {
            if (!request.status.volunteers || request.status.volunteers.length === 0 || request.status.volunteers.filter(volunteer => volunteer.volunteer === volunteer_id).length === 0) {
                return {
                    current_status: volunteer_status.PENDING,
                    volunteer: volunteer_id,
                    volunteer_response: "",
                    last_notified_time: new Date(),
                    adminMessage: adminMessage
                }
            }
        });

        // Remove nulls
        new_volunteers = new_volunteers.filter(function(volunteer) { 
            if (volunteer) return volunteer
        });

        // Update volunteer list and last modified time
        if (new_volunteers.length > 0) {
            await RequestRepository.updateRequest(requestID, {
                $push: {
                    'status.volunteers': { $each: new_volunteers }
                }, 
                $set: {
                    'admin_info.last_modified_time': new Date()
                }
            });
        } else {
            return request;
        }

        // Update request status to be matched if there are volunteers attached to it
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];
        var matchedVolunteers = 0;
        updatedRequest.status.volunteers.forEach(volunteer => {
            if (volunteer.current_status === volunteer_status.IN_PROGRESS || volunteer.current_status === volunteer_status.PENDING) {
                matchedVolunteers += 1;
            }
        });
        if (matchedVolunteers > 0) {
            await RequestRepository.updateRequest(requestID, {
                $set: {
                    'status.current_status': request_status.MATCHED
                }
            });
        }

        return updatedRequest;
        // TODO -> send emails

    } catch (e) {
        throw e;
    }
}

/**
 * Unmatch all attached volunteers from a list
 */
exports.unmatchVolunteers = async function(requestID, volunteers) {
    try {
        let request = (await RequestRepository.readRequest({_id: requestID}))[0]; // Find the relevant request
        let removing_volunteers = volunteers.map(function (volunteer_id) {
            if (request.status.volunteers.filter(volunteer => volunteer.volunteer === volunteer_id && volunteer.current_status !== volunteer_status.REJECTED).length !== 0) { // Get all attached volunteers from the volunteers list who have not already rejected the request
                return volunteer_id
            }
        });

        // Null check
        removing_volunteers = removing_volunteers.filter(function(volunteer) { 
            if (volunteer) return volunteer
        });

        // If there are volunteers that need to be removed
        if (removing_volunteers.length > 0) {
            var current_request = (await RequestRepository.readRequest({_id: requestID}))[0];
            current_request.admin_info.last_modified_time = new Date();
            current_request.status.volunteers.forEach(function(v, index, array) {
                if (removing_volunteers.filter(volunteer_id => volunteer_id === v.volunteer).length !== 0) {
                    // update the volunteer status for volunteers that are being unmatched from the request
                    array[index] = {
                        current_status: volunteer_status.REJECTED,
                        volunteer: v.volunteer,
                        last_notified_time: new Date()
                    }
                }
            });
            await RequestRepository.updateRequest(requestID, current_request);
        }

        // If there are no more matched volunteers, request becomes unmatched
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];
        var matchedVolunteers = 0;
        updatedRequest.status.volunteers.forEach(volunteer => {
            if (volunteer.current_status === volunteer_status.IN_PROGRESS || volunteer.current_status === volunteer_status.PENDING) {
                matchedVolunteers += 1;
            }
        });
        if (matchedVolunteers === 0) {
            await RequestRepository.updateRequest(requestID, {
                $set: {
                    'status.current_status': request_status.UNMATCHED
                }
            });
        }

        return updatedRequest;
        // TODO -> send emails

    } catch (e) {
        throw e;
    }
}

/**
 * Volunteer accepting a request
 */
exports.acceptRequest = async function(volunteerID, requestID) {
    try {
        // Update a particular volunteer's volunteer-request-status to in_progress
        await RequestRepository.updateRequestComplex({'_id': requestID, 'status.volunteers.volunteer': volunteerID}, { 
            $set: {
                "status.volunteers.$.current_status": volunteer_status.IN_PROGRESS,
                "status.volunteers.$.last_notified_time": new Date()
            }
        });
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];

        // TODO -> Notify admins
        return updatedRequest;
    } catch (e) {
        throw e;
    }
}

/**
 * Volunteer rejecting a request
 */
exports.rejectRequest = async function(volunteerID, requestID) {
    try {
        // Unmatch the volunteer from the request
        await exports.unmatchVolunteers(requestID, [volunteerID]);
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];

        // TODO -> Notify admins
        return updatedRequest;
    } catch (e) {
        throw e;
    }
}

/**
 * Volunteer completing a request
 */
exports.completeRequest = async function(volunteerID, requestID, reason, volunteer_comment) {
    try {
         // Update a particular volunteer's volunteer0request0status to complete and append any completion info
        await RequestRepository.updateRequestComplex({'_id': requestID, 'status.volunteers.volunteer': volunteerID}, { 
            $set: {
                "status.volunteers.$.current_status": volunteer_status.COMPLETE,
                "status.volunteers.$.volunteer_response": volunteer_comment,
                "status.volunteers.$.last_notified_time": new Date()
            }
        });

        // Count the number of volunteer's who have completed this request
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];
        var completeCount = 0;
        updatedRequest.status.volunteers.forEach(volunteer => {
            if (volunteer.current_status === volunteer_status.COMPLETE) {
                completeCount += 1;
            }
        });
        // if the complete count is equal to the inital volunteer quota, complete the entire request
        if (completeCount === updatedRequest.status.volunteer_quota) {
            await RequestRepository.updateRequest(requestID, {
                $set: {
                    'status.current_status': request_status.COMPLETED,
                    'status.completed_reason': reason,
                    'status.completed_date': new Date()
                }
            });
        }

        // TODO -> Notify admins
        return updatedRequest;
    } catch (e) {
        throw e;
    }
}

/**
 * Update the details of a request
 */
exports.updateRequestDetails = async function(requestID, updates) {
    try {
        updates["admin_info.last_modified"] = new Date()
        await RequestRepository.updateRequest(requestID, updates);
        let updatedRequest = (await RequestRepository.readRequest({_id: requestID}))[0];
        return updatedRequest;
    } catch (e) {
        throw e;
    }
}