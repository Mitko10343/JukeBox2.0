const express = require('express');
const router = express.Router();
const db = require('../custom_modules/firestore');


const notLoggedIn = (req, res, next) => {
    if (typeof req.session.user !== 'undefined')
        res.redirect(`/users/`);
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
router.get('/discover/music', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    if (Object.keys(req.query).length !== 0) {
        const genre = req.query.genre;
        const order = req.query.order;
        const page = typeof req.query.page !== 'undefined' ? req.query.page : 1;
        const pagination = typeof req.query.pagination !== 'undefined' ? req.query.pagination : 10;

        if (genre === 'default' && order !== 'default') {
            db.order(order).then(orderedSongs => res.render('discover_music', {songData: orderedSongs}));
        } else if (genre !== 'default' && order !== 'default') {
            db.genreOrder(genre, order).then(orderedSongs => res.render('discover_music', {songData: orderedSongs}));
        } else if (genre !== 'default' && order === 'default') {
            db.getGenre(genre).then(orderedSongs => res.render('discover_music', {songData: orderedSongs}));
        } else {
            db.getSongs(pagination, page).then(songData => res.render('discover_music', {songData})).catch(err => console.log(err));
        }
    } else {
        db.getSongs(0, 1).then(songData => res.render('discover_music', {songData}))
            .catch(err => console.log(err));
    }
});
router.get('/discover/artists', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    db.getArtists().then(artists => {
        res.render('discover_artists', {artists,user});
    }).catch(error => console.error(error));

});
router.get('/discover/playlists', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    res.render('discover_playlists');
});

/*NOT IMPLEMENTED YET*/
/*GET STORE PAGE*/
router.get('/store', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
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

    db.getUser(username).then(user => {
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
    const account_details = {
        username: req.body.username,
        password: req.body.pwd,
        email: req.body.email,
        account_type: req.body.account
    };
    //enter user credentials to firestore
    db.registerUser(account_details)
        .then(message => {
            console.log(message);
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

router.get('/search', (req, res) => {
    const search = typeof req.query.value;

});

router.get('/view/profile', (req, res) => {
    if (Object.keys(req.query).length === 0) {
        res.redirect('/discover/artists');
    } else if (typeof req.session.user !== 'undefined' && req.session.user.user === req.query.username) {
        res.redirect('/users/profile');
    } else {
        const artist = req.query.username;

        if (typeof artist === 'undefined') {
            res.redirect('/dicover/artists');
        } else {
            db.getUser(artist)
                .then(record => res.render('profile', {user:{
                            username:record.username,
                            email:record.email,
                            account_type:record.account_type,
                            coverUrl: record.coverUrl,
                            profileUrl: record.profileUrl
                    }}))
                .catch(error => {
                    console.error(error);
                })
        }
    }
});


module.exports = router;
