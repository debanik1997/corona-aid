import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css'
import './Home.css'
import Offers from './Offers';
import YourOffer from './YourOffer';
import LoginRegisterModal from './LoginRegisterModal';
import HelpfulLinks from './HelpfulLinks';
import Loading from './Loading';
// import RequestHelp from './RequestHelp';
import VolunteerBadge from './components/VolunteerBadge';
// import NewLogin from './NewLogin';
// import NewRegister from './NewRegister';
// import NewOffers from './NewOffers';
// import LocationSetting from './LocationSetting';
import VolunteerPortal from './VolunteerPortal'
import AboutUs from './AboutUs'
import HowItWorks from './HowItWorks'
import Feedback from './Feedback'
import HomePage from './HomePage'

import fetch_a from './util/fetch_auth';

import Container from 'react-bootstrap/Container';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Geocode from "react-geocode";
import InputGroup from 'react-bootstrap/InputGroup'
import Badge from 'react-bootstrap/Badge'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Jumbotron from 'react-bootstrap/Jumbotron'

import Cookie from 'js-cookie'

Geocode.setApiKey("AIzaSyCikN5Wx3CjLD-AJuCOPTVTxg4dWiVFvxY");

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      latitude: '',
      longitude: '',
      zipCode: '',
      currentNeighborhood: '',
      locality: '',
      nonCookieLat: '',
      nonCookieLong: '',
      nonCookieZip: '',
      nonCookieNeighborhood: '',
      promptChangeZip: false,
      isLoaded: false,
      isLoggedIn: false,
      first_name: '',
      last_name: '',
      currentUser: undefined,
      currentUserAvailability: false,
      checked: false,
      showLogin: false,
      showRegistration: false,
      showWorks: false,
      showAbout: false,
      showLocation: false,
      showFeedback: false,
      showModal: false,
      modalType: '',
      cookieSet: false,
      searchedLocation: '',
      currentState: '',
      width: 0,
      totalVolunteers: 0,
      justVerified: false,
      currentClickedUser: '',
      showRequestHelp: false,
      requestHelpMode: '',
      associations: [],
      currentAssoc: {},
      volunteerPortal: false,
      toggled: false
    }

    window.addEventListener("resize", this.update);
    
    this.offerElement = React.createRef();

    this.handleHideLocation = this.handleHideLocation.bind(this);
    this.handleShowLocation = this.handleShowLocation.bind(this);
    this.handleHideModal = this.handleHideModal.bind(this);
    this.handleShowModal = this.handleShowModal.bind(this);
    this.handleHidePrompt = this.handleHidePrompt.bind(this);
    this.getMyLocation = this.getMyLocation.bind(this)
    this.logout = this.logout.bind(this);
    this.refreshLocation = this.refreshLocation.bind(this);
    this.handleShowLogin = this.handleShowLogin.bind(this);
    this.handleHideLogin = this.handleHideLogin.bind(this);
    this.handleShowRegistration = this.handleShowRegistration.bind(this);
    this.handleHideRegistration = this.handleHideRegistration.bind(this);
    this.setLatLongFromZip = this.setLatLongFromZip.bind(this);
    this.handleShowRequestHelp = this.handleShowRequestHelp.bind(this);
    this.handleHideRequestHelp = this.handleHideRequestHelp.bind(this);
    this.findAssociations = this.findAssociations.bind(this)
    this.toggleNavBar = this.toggleNavBar.bind(this);
  }

  handleHideRequestHelp() {
    this.setState({showRequestHelp: false});
  }

  handleShowRequestHelp() {
    this.setState({showRequestHelp: true});
  }

  handleShowLocation() {
    this.setState({showLocation: true});
  }

  handleHideLocation() {
    this.setState({showLocation: false});
  }
    
  handleHidePrompt() {
    this.setState({promptChangeZip: false});
  }

  handleShowLogin() {
    this.setState({showLogin: true});
  }

  handleHideLogin() {
    this.setState({showLogin: false})
  }

  handleShowRegistration() {
    this.setState({showRegistration: true});
  }

  handleHideRegistration() {
    this.setState({showRegistration: false});
  }

  handleShowModal(modalType) {
    this.setState({modalType: modalType})
    this.setState({showModal: true});
  }
  
  handleHideModal() {
    this.setState({showModal: false});
  }

  componentDidMount() {
    if (this.props.location.verified) {
      this.setState({showRegistration: true});
      this.setState({justVerified: true});
    }
    this.getMyLocation();
    this.update();
    if (!this.state.isLoggedIn && Cookie.get("token")) {
      this.fetchUser()
    }
    fetch('/api/users/totalUsers')
      .then((res) => res.json())
      .then((res) => {
        this.setState({totalVolunteers: res.count});
      });
  }

  update = () => {
    this.setState({
      width: window.innerWidth
    });
  };

  fetchUser(){
    fetch_a('/api/users/current')
      .then((response) => response.json())
      .then((user) => {
        this.setState({ checked: user.availability });
        this.setState({ isLoggedIn: true });
        this.setState({ first_name: user.first_name });
        this.setState({ last_name: user.last_name });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  updateNeighborhood(shouldUpdate) {
    if (shouldUpdate) {
      this.setState({
        latitude: this.state.nonCookieLat,
        longitude: this.state.nonCookieLong,
        currentNeighborhood: this.state.nonCookieNeighborhood,
        zipCode: this.state.nonCookieZip
      });
      // console.log(this.offerElement);
      // this.offerElement.current.refreshOffers(this.state.nonCookieLat, this.state.nonCookieLong);
    }
    this.handleHidePrompt();
  }

  setNeighborhood(latitude, longitude, zipCode) {
    if (this.state.isLoaded) {
      return;
    }

    Geocode.fromLatLng(latitude, longitude).then(
      response => {
        var foundNeighborhood = '';
        var foundZipCode = '';
        var prevLocality = '';
        var locality = '';

        this.findAssociations(latitude, longitude, this);
        for (var i = 0; i < Math.min(4, response.results.length); i++) {
          const results = response.results[i]['address_components'];
          // console.log(results);
          for (var j = 0; j < results.length; j++) {
            const types = results[j].types;
            // find neighborhood from current location

            if (types.includes('neighborhood') || types.includes('locality')) {
              if (foundNeighborhood === '') {
                foundNeighborhood = results[j]['long_name'];
              }
            }
            // find zip code from current location
            if (types.includes('postal_code')) {
              if (foundZipCode === '') {
                foundZipCode = results[j]['long_name'];
              }
            }
            
            for (var k = 0; k < types.length; k++) {
              const type = types[k];
              if (type.includes('administrative_area_level')) {
                if (locality === '') {
                  locality = prevLocality;
                }
              }
            }
            prevLocality = results[j]['long_name'];
          }
        }

        if (zipCode !== '') {
          foundZipCode = zipCode;
        }

        var date = new Date();
        date.setTime(date.getTime() + ((60 * 60 * 1) * 1000));
        Cookie.set('latitude', latitude, { expires: date });
        Cookie.set('longitude', longitude, { expires: date });
        Cookie.set('zipcode', foundZipCode, { expires: date });
        Cookie.set('neighborhood', foundNeighborhood, { expires: date });
        Cookie.set('locality', locality, { expires: date })
        this.setState({
          isLoaded: true,
          latitude: latitude,
          longitude: longitude,
          currentNeighborhood: foundNeighborhood,
          zipCode: foundZipCode,
          locality: locality
        });

        // // if cookie is set, need to prompt user to pick which location to use
        // if (this.state.cookieSet && Cookie.get('zipcode') !== foundZipCode) {
        //   this.setState({
        //     nonCookieLat: latitude,
        //     nonCookieLong: longitude,
        //     nonCookieZip: foundZipCode,
        //     nonCookieNeighborhood: foundNeighborhood,
        //     promptChangeZip: true
        //   });
        // } 
        // if (!this.state.cookieSet) {
        //   console.log("not set yet");
        //   Cookie.set('latitude', latitude);
        //   Cookie.set('longitude', longitude);
        //   Cookie.set('zipcode', foundZipCode);
        //   Cookie.set('neighborhood', foundNeighborhood);
        //   this.setState({
        //     isLoaded: true,
        //     latitude: latitude,
        //     longitude: longitude,
        //     currentNeighborhood: foundNeighborhood,
        //     zipCode: foundZipCode
        //   });
        // } else {
        //   this.setState({isLoaded: true});
        // }
      },
      error => {
        console.error(error);
      }
    );
  }

  // Set association objects
  findAssociations(lat, long, currentComponent) {
    var url = "/api/association/get_assoc/lat_long?";
    let params = {
        'latitude': lat,
        'longitude': long
    }
    let query = Object.keys(params)
          .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
          .join('&');
    url += query;

    async function fetchData() {
        const response = await fetch(url);
        response.json().then((data) => {
            console.log(data);
            currentComponent.setState({associations: data});
            if (data[0]) {
              currentComponent.setState({currentAssoc: data[0]})
            }
        });
    }
    fetchData();
  }

  // Finds lat and long from cookie first and if found will load page
  // lat and long will be updated once geolocation is working
  getMyLocation() {
    let currentComponent = this;
    // If cookie is set, keep that lat and long with associated zip code
    if (Cookie.get('latitude') 
        && Cookie.get('longitude')
        && Cookie.get('zipcode')
        && Cookie.get('neighborhood')
        && Cookie.get('locality')) {
      const lat = Cookie.get('latitude');
      const long = Cookie.get('longitude');
      const zip = Cookie.get('zipcode');
      const neighborhood = Cookie.get('neighborhood');
      const locality = Cookie.get('locality');
      this.setState({
        cookieSet: true,
        isLoaded: true,
        latitude: lat,
        longitude: long,
        currentNeighborhood: neighborhood,
        locality: locality,
        zipCode: zip
      });
      this.findAssociations(lat, long, currentComponent);
      return;
    }

    // set actualLat and actualLong for the current users real location
    // only if cookie has been set already
    // ask user to confirm their current location now
    const location = window.navigator && window.navigator.geolocation;
    if (location) {
      location.getCurrentPosition((position) => {
        // Use actual current lat long to find zip and neighborhood
        this.setNeighborhood(position.coords.latitude, position.coords.longitude, '');
        this.findAssociations(position.coords.latitude, position.coords.longitude, currentComponent);
      }, (error) => {
        console.log("No geolocation");
      });
    }

  }

  logout() {
    Cookie.remove('token');
    window.location.reload(false);
  }

  refreshLocation() {
    Cookie.remove('latitude');
    Cookie.remove('longitude');
    Cookie.remove('zipcode');
    Cookie.remove('neighborhood');
    this.setState({isLoaded: false, searchedLocation: ''});
    this.getMyLocation();
  }

  handleLocationChange = (location) => {
      this.setState({
          searchedLocation: location
      })
  }

  onLocationSubmit = (e, location) => {
      e.preventDefault();
      this.handleHideLocation();
      this.setState({searchedLocation: ''});
      Geocode.fromAddress(location).then(
        response => {
          const { lat, lng } = response.results[0].geometry.location;
          Cookie.remove('latitude');
          Cookie.remove('longitude');
          Cookie.remove('zipcode');
          Cookie.remove('neighborhood');
          this.setState({isLoaded: false});
          this.setNeighborhood(lat, lng, '');
        },
        error => {
          alert("Invalid address");
        }
      );
  }

  setLatLongFromZip(event, zipCode) {
    event.preventDefault();
    event.stopPropagation();
    Geocode.fromAddress(zipCode).then(
      response => {
        const { lat, lng } = response.results[0].geometry.location;
        this.setNeighborhood(lat, lng, zipCode);
      },
      error => {
        console.error(error);
      }
    );
  }

  toggleNavBar(e) {
    this.setState({toggled: e});
  }

  render() {
		var collapsed = false
		if (this.state.width <= 767) {
			collapsed = true;
		}


    const { isLoaded } = this.state;
    const { isLoggedIn } = this.state;

    // var jumboStyling = '%'
    var bulletin;
    var offer;
    var link;
    var covaidText = "Covaid connects community volunteers with those who need help"
    if (this.state.width < 575) {
      bulletin = "Bulletin";
      console.log("less");
      offer = "My Offer";
      link = "Links";
    } else {
      bulletin = "Community Bulletin";
      offer = "My Offer";
      link = "Helpful Links";
    }
		
    var titleSize = 43;
    if (this.state.width <= 350) {
      covaidText = "";
      titleSize = 30;
    }

    var communityButton = <></>;
    var communityText = "Want to help your community?";
    if (this.state.width <= 374) {
      communityText = "Want to help?"
    }

    if (!this.state.isLoggedIn) {
      if (this.state.width <= 767) {
        communityButton = <>
          <Button variant="outline-light" 
                  style={{outlineWidth: "thick",
                          textAlign: 'right',
                          paddingLeft: 5,
                          paddingRight: 5,
                          paddingTop: 0,
                          paddingBottom: 2,
                          marginRight: 3}}
                  id = 'howHelpButton1'
                  onClick={this.handleShowRegistration}>
            <font id ="help" 
                  style = {{color:"white", 
                            fontWeight: 600,
                            fontSize: 11, whiteSpace: 'nowrap'}}>
              {communityText}
            </font>
          </Button></>
      }
    }

    var rightNav;
    var yourOffer;
    var howHelp;
    var clickText = <></>;
    var volunteerButton = <></>
    if (isLoggedIn) {
      yourOffer = <Tab eventKey="your-offer" title={offer} className="tabColor" id='bootstrap-overide'>
                    <YourOffer state = {this.state}/>
                  </Tab>;  
      volunteerButton =  <Button onClick={() => this.setState({volunteerPortal: true})} id="homeButtons" >
          Volunteer portal
        </Button>

      if (this.state.toggled) {
        rightNav = <Form inline id = "getStarted" style ={{display: 'block'}}>
                    <Button variant="outline-danger" id='logoutButton' onClick={this.logout} style={{width: '100%'}}>
                      <font id = "logout" style = {{color: '#dc3545', fontWeight: 600, fontSize: 13}}>
                        Logout
                      </font>
                    </Button>
                  </Form>;
      } else {
        rightNav = <Form inline id = "getStarted" style ={{display: 'block', marginRight: '10%'}}>
                    {!collapsed ? <span id="name">
                      Hello, {this.state.first_name}
                    </span> : <></>}
                    <Button variant="outline-danger" id='logoutButton' onClick={this.logout}>
                      <font id = "logout" style = {{color: 'white', fontWeight: 600, fontSize: 13}}>
                        Logout
                      </font>
                    </Button>
                  </Form>;
      }
                  howHelp = <><h5>My Offer</h5>
                  <p style={{fontWeight: 300}}>Under this tab, logged-in users can create their own offers for support. They can choose 
                  their primary neighborhood to support, provide more details regarding their offer, and update their availability status (whether or not they want their offer to be displayed on the community bulletin.).</p></> 
       if (this.state.width > 350) {
        clickText = <h6 style = {{fontWeight: 300, fontStyle: 'italic', color: 'white', marginBottom: 5}}>Use the <strong style={{fontWeight: 600, fontStyle: "normal"}}>My Offer</strong> tab below to create/update your offer to help</h6>
       }
    } else {
      if (collapsed === false) {
        rightNav = <Form inline id = "getStarted" style ={{display: 'block', marginRight: '10%'}}>
                    <Button variant="outline-light" id = 'homeButtons'onClick={this.handleShowLogin}>
                      Volunteer Login
                    </Button>
                  </Form>
      } else {
        rightNav = <Form inline id = "getStarted" style ={{display: 'block'}}>
                    <Button variant="outline-light" id='loginButton' onClick={this.handleShowLogin} style={{width: '100%'}}>
                      <font id = "login" style = {{color: '#194bd3', fontWeight: 600, fontSize: 13}}>
                        Volunteer Login
                      </font>
                    </Button>
                  </Form>;
      }
      yourOffer = <></>;
      howHelp = <></>;
      volunteerButton = <Button onClick={() => this.setState({showRegistration: true})} id="homeButtons" >
                          Volunteer Sign up
                        </Button>
    }

    var pageContent = <></>
    if (this.state.volunteerPortal) {
      pageContent = <VolunteerPortal state={this.state}/>
    } else {
      pageContent = <HomePage state={this.state} 
                              setState={this.setState}
                              handleShowModal={this.handleShowModal} 
                              handleHideRequestHelp={this.handleHideRequestHelp}
                              handleShowRegistration={this.handleShowRegistration}
                              handleHideLogin={this.handleHideLogin}
                              handleHideRegistration={this.handleHideRegistration}
                              handleLocationChange={this.handleLocationChange}
                              onLocationSubmit={this.onLocationSubmit}
                              handleShowRequestHelp={this.handleShowRequestHelp}
                              requestHelpMode={this.requestHelpMode}
                              clickOnUser={this.clickOnUser}
                              volunteerButton={volunteerButton}
                              refreshLocation={this.refreshLocation}
                              setLatLong={this.setLatLongFromZip}/>
    }

    var modal = <></>
    switch(this.state.modalType) {
      case 1:
        modal = <AboutUs />
        break;
      case 2:
        modal = <HowItWorks />
        break;
      case 3:
        modal = <Feedback handleHide={this.handleHideModal}/>
        break;
      case 4:
        modal = <>
         <Modal.Header closeButton>
                <Modal.Title>Useful Resources in the Midst of COVID-19</Modal.Title>
          </Modal.Header>
          <Modal.Body><HelpfulLinks /></Modal.Body>
          </>
        break;
      default:
        modal = <></>
    }

    return (
      <>
        <link href="https://fonts.googleapis.com/css?family=Baloo+Chettan+2:400&display=swap" rel="stylesheet"></link>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

        <div className="App">
          <Navbar collapseOnSelect 
                  onToggle={this.toggleNavBar}
                  variant="light" 
                  expand="md"
                  className = {this.state.toggled ? 'customNavToggled': 'customNav'}>
            <Navbar.Brand className={'home'} href = {window.location.protocol + '//' + window.location.host}
              style={this.state.toggled ? {'color': '#194bd3'} : {'color': 'white'}}>
              covaid
            </Navbar.Brand>
            <Form inline className="volunteer-badge-mobile">
              <Badge aria-describedby='tooltip-bottom' variant="success" id='volunteer-mobile'>{this.state.totalVolunteers} Volunteers</Badge>
              <Navbar.Toggle aria-controls="basic-navbar-nav" id={this.state.toggled ? 'toggledNav1': 'nav1'}/>
            </Form>

            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="mr-auto">
                <Nav.Link className={this.state.toggled ? 'navBorderToggled': 'navBorder'} onClick={() => this.handleShowModal(1)} >
                  <p id={this.state.toggled ? 'navLinkToggled': 'navLink'}>About us</p>
                </Nav.Link>
                <Nav.Link className={this.state.toggled ? 'navBorderToggled': 'navBorder'} onClick={() => this.handleShowModal(2)}>
                  <p id={this.state.toggled ? 'navLinkToggled': 'navLink'}>How it works</p>
                </Nav.Link>
                <Nav.Link className={this.state.toggled ? 'navBorderToggled': 'navBorder'} onClick={() => this.handleShowModal(3)}>
                  <p id={this.state.toggled ? 'navLinkToggled': 'navLink'}>Feedback</p>
                </Nav.Link>
                <Nav.Link className="volunteer-badge-web">
                  <VolunteerBadge totalVolunteers={this.state.totalVolunteers}/>
                </Nav.Link>
              </Nav>
              {rightNav}
            </Navbar.Collapse>
          </Navbar>
          {pageContent}
      </div>

      <Modal show={this.state.showModal} onHide={this.handleHideModal} style = {{marginTop: 60}}>
        {modal}
      </Modal>
    </>);
  }
}

export default Home;