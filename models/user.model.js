const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const Schema = mongoose.Schema;

let UsersSchema = new Schema({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, required: true},
    phone: {type: String, required: false},
    availability: {type: Boolean, required: true},
    hash: {type: String, required: true},
    salt: {type: String, required: true},
    preVerified: {type: Boolean},
    verified: {type: Boolean},
    agreedToTerms: {type: Boolean},
    pronouns: {type: String},
    note: {type: String},
    offer: {
        tasks: [String],
        neighborhoods: [String],
        details: {type: String},
        car: {type: Boolean, requried: true},
        timesAvailable: [String],
        state: [String],
        canHelp: {type: Boolean},
        helpDetails: {type: String}
    },
    location: {
        type: { type: String },
        coordinates: {
            type: [Number],
            index: "2dsphere"
        }
    },
    association: {type: String},
    association_name: {type: String},
    languages: [String]
});


UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash === hash;
};

UsersSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);
    const secret = process.env.SECRET || "secret"
    return jwt.sign({
    email: this.email,
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10),
    }, secret);
}

UsersSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        token: this.generateJWT(),
    };
};

UsersSchema.methods.toJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        phone: this.phone,
        first_name: this.first_name,
        last_name: this.last_name,
        availability: this.availability,
        latlong: this.location.coordinates,
        offer: {
            neighborhoods: this.offer.neighborhoods,
            tasks: this.offer.tasks,
            details: this.offer.details,
            car: this.offer.car,
            timesAvailable: this.offer.timesAvailable,
            state: this.state
        },
        association: this.association,
        association_name: this.association_name,
        languages: this.languages,
        preVerified: this.preVerified,
        note: this.note,
        pronouns: this.pronouns,
    };
};

module.exports = mongoose.model('Users', UsersSchema);