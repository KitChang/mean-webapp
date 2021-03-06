var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config/env');


var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: 'Username already exists',
    required: 'Please fill in a username',
    lowercase: true,
    trim: true
  },
  hash: String,
  salt: String,
  profileImageURL: {
    type: String,
    default: 'images/default.png'
  },
  roles: {
    type: [{
      type: String,
      enum: ['user', 'admin']
    }],
    default: ['user'],
    required: 'Please provide at least one role'
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign({
    _id: this._id,
    roles: this.roles,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, config.secret);
};

mongoose.model('User', UserSchema);