var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config/env');
var mongoose = require('mongoose');
var passport = require('passport');
require('./models/Users');
require('./config/passport');
require('./models/Stops');
require('./models/Propertys');
require('./models/Shops');
require('./models/Cards');
require('./models/Logs');
require('./models/Events');
mongoose.connect('mongodb://' + config.mongolab.uri);
console.log('mongodb:' + config.mongolab.uri);

var routes = require('./routes/index');
var users = require('./routes/users');
var stops = require('./routes/stops');
var propertys = require('./routes/propertys');
var api = require('./routes/api');
var shops = require('./routes/shops');
var cards = require('./routes/cards');
var logs = require('./routes/logs');
var events = require('./routes/events');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());

app.use('/', routes);
app.use('/users', users);
app.use('/stops', stops);
app.use('/propertys', propertys);
app.use('/shops', shops);
app.use('/cards', cards);
app.use('/logs', logs);
app.use('/events', events);
app.use('/api', api);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
