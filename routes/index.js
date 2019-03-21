const express = require('express');
const router = express.Router();
const db = require('../custom_modules/firestore');

const notLoggedIn = (req, res, next) => {
    if (typeof req.session.user !== 'undefined')
        res.redirect(`/users/${req.session.user.user}`);
    else
        next();
};

/*WORKING CORRECTLY*/
/* GET home page. */
router.get('/', notLoggedIn, (req, res) => {
    res.render('index', {title: 'Jukebox'});
});
/*WORKING 50% MORE FUNCTIONALITY*/
/*IF A USER SESSION IS PRESENT THEN THE USER SHOULD BE ABLE TO CLICK ON
* SONGS AND ADD THEM TO THEIR PLAYLISTS
* */
/*GET DISCOVER PAGE*/
router.get('/discover', (req, res) => {
    if (Object.keys(req.query).length !== 0) {
        const genre = req.query.genre;
        const order = req.query.order;
        const page = typeof req.query.page !== 'undefined' ? req.query.page : 1;
        const pagination = typeof req.query.pagination !== 'undefined' ? req.query.pagination : 10;

        if (genre === 'default' && order !== 'default') {
            db.order(order).then(orderedSongs => res.render('discover', {songData: orderedSongs}));
        } else if (genre !== 'default' && order !== 'default') {
            db.genreOrder(genre, order).then(orderedSongs => res.render('discover', {songData: orderedSongs}));
        } else if (genre !== 'default' && order === 'default') {
            db.getGenre(genre).then(orderedSongs => res.render('discover', {songData: orderedSongs}));
        } else {
            db.getSongs(pagination, page).then(songData => res.render('discover', {songData})).catch(err => console.log(err));
        }
    } else {
        db.getSongs(10, 1).then(songData => res.render('discover', {songData}))
            .catch(err => console.log(err));
    }
});
/*NOT IMPLEMENTED YET*/
/*GET STORE PAGE*/
router.get('/store', notLoggedIn, (req, res) => {
    res.render('store', {title: 'Store'});
});
/*WORKING CORRECTLY*/
/*GET LOGIN PAGE*/
router.get('/login', notLoggedIn, (req, res) => {
    res.render('logIn', {title: 'Login'});
});
/*WORKING CORRECTLY*/
/*GET REGISTER USER ACCOUNT*/
router.get('/register', notLoggedIn, (req, res) => {
    res.render('register', {title: 'Register'});
});


/*WORKING CORRECTLY*/
/*POST LOGIN*/
router.post('/login', notLoggedIn, (req, res) => {
    //authenticate user with firestore
    const username = req.body.username;
    const password = req.body.password;
    const artist_account = typeof req.body.artist_account === `undefined` ? 'users' : 'artists';

    db.getUser(username, artist_account)
        .then(user => {
            if (!user)
                res.redirect('/login');
            else if (user.password !== password)
                res.redirect('/login');
            else {
                req.session.user = {
                    user: username,
                    account_type: user.account_type,
                    coverUrl: user.coverUrl,
                    profileUrl: user.profileUrl,
                };
                res.redirect(`/users`);
            }
        }).catch(error => {
        console.error(error);
    });
});
/*WORKING CORRECTLY*/
/*POST REGISTER ACCOUNT*/
router.post('/register', notLoggedIn, (req, res) => {
    const account = typeof req.body.artist_account === `undefined` ? 'users' : 'artists';
    const account_details = {
        username: req.body.username,
        password: req.body.pwd,
        email: req.body.email,
        account_type:account
    };

    //enter user credentials to firestore
    db.registerUser(account_details)
        .then(response => {
            if (response.code === -1) {
                res.status(400);
            } else
                res.status(200).render('login', {title: 'login'});
        }).catch(error => {
        console.error(error);
    })
});
/*WORKING CORRECTLY*/
//Route that is responsible for updating the views on songs
router.post('/updateView', (req, res) => {
    const views = req.body.views;
    const songName = req.body.name;
    db.updateViews(songName, views);
    res.status(200).end();
});


module.exports = router;
