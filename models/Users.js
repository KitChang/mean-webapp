var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config/env');


var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    //unique: 'Username already exists',
    //required: 'Please fill in a username',
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
      enum: ['user', 'client', 'admin']
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
  },
  fbId: String,
  fbName: String,
  fbToken: String,
  wxId: {
    type:String,
    unique: false
  },
  wxName: String,
  wxToken: String,
  sex: {
    type:String,
    default: "0"
  },
  birthday: {
    type: Date
  },
  name: String,
  registType: {
    type: String,
    enum: ['local', 'facebook', 'weixin'],
    required: 'Please provide at least one type'
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