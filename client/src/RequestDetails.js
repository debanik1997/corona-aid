import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button'
import RequestMatches from './RequestMatches'
import Modal from 'react-bootstrap/Modal'
import InputGroup from 'react-bootstrap/InputGroup'
import FormControl from 'react-bootstrap/FormControl'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import VolunteerDetails from './VolunteerDetails'
import { useFormFields } from "./libs/hooksLib";
import { formatName } from './OrganizationHelpers'

export default function RequestDetails(props) {

    const [topMatchesModal, setTopMatchesModal] = useState(false);
    const [assignee, setAssignee] = useState('');
    const [volunteerDetailModal, setVolunteerDetailsModal] = useState(false);
    const [notesModal, setNotesModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [unmatchModal, setUnmatchModal] = useState(false);
    const [confirmCompleteModal, setConfirmCompleteModal] = useState(false);
    const [reason, setReason] = useState('');
    const [mapsURL, setMapsURL] = useState('');
    const options = ['Call ahead to store and pay (Best option)',
                     'Have volunteer pay and reimburse when delivered',
                     'N/A']

    const [fields, handleFieldChange] = useFormFields({
        email2: ""
    });

    useEffect(() => {
        setAssignee(props.currRequest.assignee ? props.currRequest.assignee : '');
        var tempURL = "https://www.google.com/maps/@";
        tempURL += props.currRequest.latitude + ',';
        tempURL += props.currRequest.longitude + ',15z';
        setMapsURL(tempURL);
        fields.email2 = props.currRequest.note
    }, [props.currRequest]);


    const topMatch = () => {
        props.setRequestDetailsModal(false);
        setTopMatchesModal(true);
    }

    const unMatch = () => {
        const requester_id = props.currRequest._id;
        let form = {
            'request_id': requester_id
        };

        fetch('/api/request/removeVolunteerFromRequest', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        }).then((response) => {
            if (response.ok) {
                console.log("attached");
                setTopMatchesModal(false);
                props.setRequestDetailsModal(false);
                window.location.reload();
            } else {
                alert("unable to attach");
            }
        }).catch((e) => {
            console.log(e);
        });
    }

    const completeRequest = async e => {
        e.preventDefault();
        e.stopPropagation();

        const requester_id = props.currRequest._id;
        let form = {
            'request_id': requester_id,
            'reason': reason
        };

        fetch('/api/request/completeRequest', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        }).then((response) => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert("unable to attach");
            }
        }).catch((e) => {
            console.log(e);
        });
    }

    const assignVolunteer = () => {
        const requester_id = props.currRequest._id;

        let form = {
            'request_id': requester_id,
            'assignee': assignee
        };

        fetch('/api/request/set_assignee', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        }).then((response) => {
            if (response.ok) {
                console.log("attached");
                window.location.reload();
            } else {
                alert("unable to attach");
            }
        }).catch((e) => {
            console.log(e);
        });
    }

    const modeButton = () => {
        if (props.mode === 1) {
            return <>
                        <Button id="nextPage" onClick={topMatch}>Match a volunteer</Button>
                        {/* <Button variant="link"
                                style={{color: 'black', width: '100%', fontSize: 14}} 
                                id="covid-resources"
                                onClick={()=>{setConfirmCompleteModal(true); props.setRequestDetailsModal(false)}}>
                            <u>Request has been completed</u>
                        </Button> */}
                        <Row>
                            <Col xs={6} style = {{padding: 0, paddingLeft: 15, paddingRight: 4}}>
                                <Button id="mark-complete" onClick={()=>{setConfirmCompleteModal(true); props.setRequestDetailsModal(false)}}>
                                    Mark Complete
                                </Button>
                            </Col>
                            <Col xs={6} style = {{padding: 0, paddingRight: 15, paddingLeft: 4}}>
                                <Button onClick={() => {setDeleteModal(true)}} id='remove-request'>Remove Request</Button>
                            </Col>
                        </Row>
                    </>;
        } else if (props.mode === 2) {
            return (<>
                    <Button id="nextPage" 
                            onClick={() => setVolunteerDetailsModal(true)}>
                            View Volunteers's Information
                    </Button>
                    <Row>
                        <Col xs={6} style = {{padding: 0, paddingLeft: 15, paddingRight: 4}}>
                            <Button id="mark-complete" onClick={()=>{setConfirmCompleteModal(true); props.setRequestDetailsModal(false);}}>
                                Mark Complete
                            </Button>
                        </Col>
                        <Col xs={6} style = {{padding: 0, paddingRight: 15, paddingLeft: 4}}>
                            <Button onClick={() => {setUnmatchModal(true); props.setRequestDetailsModal(false)}} id='remove-request'>Unmatch Request</Button>
                        </Col>
                    </Row>
                    <VolunteerDetails volunteerDetailModal={volunteerDetailModal}
                                    setVolunteerDetailsModal={setVolunteerDetailsModal}
                                    currVolunteer={props.currVolunteer}
                                    currRequest={props.currRequest}/>
                </>);
        } else {
            return (<Row>
                        <Col xs={6} style = {{padding: 0, paddingLeft: 15, paddingRight: 4}}>
                            <Button id="mark-complete" onClick={()=>{setConfirmCompleteModal(true); props.setRequestDetailsModal(false);}}>
                                Update complete status
                            </Button>
                        </Col>
                        <Col xs={6} style = {{padding: 0, paddingRight: 15, paddingLeft: 4}}>
                            <Button onClick={() => {setUnmatchModal(true); props.setRequestDetailsModal(false)}} id='remove-request'>Unmatch Request</Button>
                        </Col>
                    </Row>);
        }
    }

    const deleteRequest = () => {
        const requester_id = props.currRequest._id;
        let form = {
            'request_id': requester_id
        };

        fetch('/api/request/set_delete', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        }).then((response) => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert("unable to attach");
            }
        }).catch((e) => {
            console.log(e);
        });
    }

    const setNotes = () =>{
        let form = {
            'request_id': props.currRequest._id,
            'note': fields.email2
        };

        fetch('/api/request/set_notes', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        }).then((response) => {
            if (response.ok) {
                if (props.requests) {
                    var dup = [...props.requests];
                    for (var i = 0; i < dup.length; i++) {
                        if (props.currRequest._id === dup[i]._id) {
                            dup[i].note = fields.email2;
                        }
                    }
                    props.setRequests(dup);
                }
            } else {
                alert("unable to attach");
            }
        }).catch((e) => {
            console.log(e);
            alert('could not attach');
        });
    }

    const handleChangeReasons = (event) => {
        event.persist();
        var result = event.target.value;
        setReason(result);
    }

    // const changeCompleteStatus = () => {
    //     var result = <></>;
    //     if (props.mode == 3) {
    //         result = (<Button variant="link"
    //                     style={{color: 'black', width: '100%', fontSize: 14}} 
    //                     id="covid-resources"
    //                     onClick={()=>{setConfirmCompleteModal(true); props.setRequestDetailsModal(false)}}>
    //                 <u>Update complete status</u>
    //                 </Button>);
    //     }
    //     return result;
    // }

    return (
        <>
            <Modal show={props.requestDetailsModal} onHide={() => {props.setRequestDetailsModal(false); setNotes();}} style = {{marginTop: 0, paddingBottom: 50, zoom: '90%'}}>
                <Modal.Header closeButton>
                    <Modal.Title>Request Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {/* {changeCompleteStatus()} */}
                    {/* <h5 className="titleHeadings" style={{marginBottom: 3}}>Information</h5> */}
                    <p id="name-details">{formatName(props.currRequest.requester_first, props.currRequest.requester_last)}</p>
                    <p id="request-info">Location: <a target="_blank" href={mapsURL}>Click here</a></p>
                    {props.currRequest.requester_email ? <p id="request-info">{props.currRequest.requester_email}</p> : <></>}
                    {props.currRequest.requester_phone ? <p id="request-info">{props.currRequest.requester_phone}</p> : <></>}
                    <p id="request-info" style={{marginTop: 14}}>Languages: {props.currRequest.languages ? props.currRequest.languages.join(', ') : ''}</p>
                    <p id="request-info">Payment: {options[props.currRequest.payment]}</p>
                    <p id="request-info">Needs: {props.currRequest.resource_request ? props.currRequest.resource_request.join(', ') : ''}</p>
                    <h5 className="titleHeadings" style={{marginBottom: 3, marginTop: 16}}>Details:</h5>
                    <p id="request-info"> {props.currRequest.details}</p>
                    <h5 className="titleHeadings" style={{marginBottom: 3, marginTop: 16}}>Needed by:</h5>
                    <p id="request-info">{props.currRequest.time} of {props.currRequest.date}</p>
                    {modeButton()}
                    {/* <Button id="request-delete"
                        onClick={() => {setDeleteModal(true)}}>
                        Delete Request
                    </Button> */}
                    <Col xs={12}>
                        <p id="requestCall" style={{marginTop: -5, marginBottom: 16}}>&nbsp;</p>
                    </Col>
                    <Form onSubmit={assignVolunteer} style={{marginBottom: 12}}>
                        <InputGroup controlid="assignee">
                            <FormControl
                                placeholder="Who's tracking this request?" 
                                aria-label="Assignee for Request"
                                aria-describedby="basic-addon2"
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                            />
                            <InputGroup.Append>
                                <Button variant="outline-secondary" type="submit">Set tracker</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </Form>
                    <h5 className="titleHeadings" style={{marginBottom: 3, marginTop: 13, marginBottom: 5}}>Your Notes:</h5>
                    <Form>
                        <Form.Group controlId="email2" bssize="large">
                            <Form.Control as="textarea" 
                                        rows="6"
                                        placeholder="Details about this request"
                                        value={fields.email2 ? fields.email2 : ''} 
                                        onChange={handleFieldChange}/>
                        </Form.Group>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal size="sm" id="notes-modal" show={notesModal} onHide={() => setNotesModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Notes for {props.currRequest.requester_first}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={setNotes}>
                        <p id="createAccountText">
                            Enter notes about this request
                        </p>
                        <Form.Group controlId="email2" bssize="large">
                            <Form.Control as="textarea" 
                                        rows="4"
                                        placeholder="Details about this request"
                                        value={fields.email2} 
                                        onChange={handleFieldChange}/>
                        </Form.Group>
                        <Button id="nextPage" type="submit">Enter Details</Button>
                    </Form>
                </Modal.Body>
            </Modal>


            <Modal size="sm" id="notes-modal" show={deleteModal} onHide={() => setDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Request from {props.currRequest.requester_first}</Modal.Title>
                </Modal.Header>
            <Modal.Body>
                    <p id="createAccountText">
                        Are you sure you want to delete this request?
                    </p>
                    <Button id="request-delete" onClick={deleteRequest}>Delete Request</Button>
                </Modal.Body>
            </Modal>

            <Modal size="sm" id="notes-modal" show={unmatchModal} onHide={() => {setUnmatchModal(false); props.setRequestDetailsModal(true);}}>
                <Modal.Header closeButton>
                    <Modal.Title>Unmatch Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p id="createAccountText">
                        Are you sure you want to unmatch this request?
                    </p>
                    <Button id="request-delete" onClick={unMatch}>Unmatch Request</Button>
                </Modal.Body>
            </Modal>

            <Modal size="sm" id="notes-modal" show={confirmCompleteModal} onHide={() => {setConfirmCompleteModal(false); props.setRequestDetailsModal(true);}}>
                <Modal.Header closeButton>
                    <Modal.Title>Completing the request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p id="createAccountText">
                        Reason the request is complete
                    </p>
                    <Form onSubmit={completeRequest}>
                        <Form.Group controlId="time" onChange={handleChangeReasons}>
                            <Form.Control as="select">
                                <option>Volunteer Completed</option>
                                <option>Could not reach</option>
                                <option>No one area</option>
                                <option>Recurring Request</option>
                                <option>Referred for support</option>
                            </Form.Control>
                        </Form.Group>
                        <Button id="nextPage" type='submit'>Complete Request</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <RequestMatches topMatchesModal={topMatchesModal} 
                            setTopMatchesModal={setTopMatchesModal} 
                            currRequest={props.currRequest}
                            association={props.association}
                            setRequestDetailsModal={props.setRequestDetailsModal}/>
        </>
    );
}