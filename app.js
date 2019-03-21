const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const keys = require('./keys/keys');
const logger = require('morgan');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const ejsLayout = require('express-ejs-layouts');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

//set up the session for the app
app.use(session({
  name : keys.sessionKeys.name,
  secret : keys.sessionKeys.secret,
  resave: false,
  saveUninitialized : false,
  cookie:{
    maxAge: keys.sessionKeys.expiration,
    sameSite:true,
    secure:keys.env.env,
  }
}));

// view engine setup
app.use(ejsLayout);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use((err, req, res, next)=> {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.listen(keys.env.port,()=>console.log(`http://127.0.0.1:${keys.env.port}`));
module.exports = app;
