const express = require('express');
const router = express.Router();

const loggedIn = (req,res,next)=>{
  if(typeof req.session.user !== 'undefined')
    next();
  else
    res.redirect('/');
};

/*WORKING CORRECTLY*/
/* GET users listing. */
router.get('/:username',loggedIn, (req, res) => {
  res.render('index',{title:'Users',user:req.session.user});
});


/*GET Profile PAGE*/
router.get('/profile',loggedIn, (req, res)=>{
  res.render('profile', { title: 'Login' });
});


module.exports = router;
