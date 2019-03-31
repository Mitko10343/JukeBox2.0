const express = require('express');
const router = express.Router();
const db = require('../custom_modules/firestore');

//Authentication function that protects routes from already logged in users
const notLoggedIn = (req, res, next) => {
    if (typeof req.session.user !== 'undefined')
        res.redirect(`/users/`);
    else
        next();
};

//get route that renders the index page
router.get('/', notLoggedIn, (req, res) => {
    res.render('index');
});

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
    const user = typeof req.session.user === 'undefined' ? undefined : req.session.user;

    db.getArtists().then(artists => {
        res.render('discover_artists', {artists, user});
    }).catch(error => console.error(error));

});
router.get('/discover/playlists', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? undefined : req.session.user.user;
    let add_button = typeof user === undefined;

    db.getAllPlaylists()
        .then(playlists => {
            res.render("discover_playlists", {
                playlists,
                user,
                add_button,
            })
        })
        .catch(error => {
            console.error(error);
            res.status(500).end();
        });
});
router.get('/discover/playlist/tracks', (req, res) => {
    if (Object.keys(req.query).length === 0 && typeof req.query === 'undefined') {
        res.status(400).end();
    }
    const playlist_name = req.query.playlist_name;
    const owner = req.query.owner;
    db.getPlaylistTracks(playlist_name, owner)
        .then(tracks => {
            res.status(200).render("partials/discover_playlist_tracks", {
                playlist_name,
                songData: tracks,
            });
        })
        .catch(error => {
            console.error(error);
            res.status(500).end();
        });
});

/*NOT IMPLEMENTED YET*/
/*GET STORE PAGE*/
router.get('/store', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    res.render('store', {title: 'Store'});
});

//Get route that renders the login page
router.get('/login', notLoggedIn, (req, res) => {
    res.render('logIn');//render login page template
});//end route

//get route that renders the register page
router.get('/register', notLoggedIn, (req, res) => {
    res.render('register');//render the register page template
});//end route

//post route that authenticates the a user for login
router.post('/login', notLoggedIn, (req, res) => {
    //get the username and password from the body of the request object
    const username = req.body.username;
    const password = req.body.password;

    //get a user record for the corresponding username
    db.getUser(username)
        .then(user => {
            //if the password from the user record doesn't matches the password for from the req.body
            //throw an error
            if (user.password !== password)
                res.status(400).render('login', {error: 'Invalid Username/Password'});
            else {
                //If the password is correct then create a user session
                req.session.user = {
                    user: username,
                    account_type: user.account_type,
                    coverUrl: user.coverUrl,
                    profileUrl: user.profileUrl,
                };
                //redirect the user to the /users route
                res.redirect(`/users`);
            }
        }).catch(error => {
        //in the case of an error log it
        console.error(error);
    });
});//end route

//post route that registers an user
router.post('/register', notLoggedIn, (req, res) => {
    //create a JSON object that will store the user record to be added to the database
    const account_details = {
        username: req.body.username,
        password: req.body.pwd,
        email: req.body.email,
        account_type: req.body.account
    };

    //enter user credentials to firestore
    db.registerUser(account_details)
        .then(message => {
            //if a response message is returned then log it and render the login page for the user
            console.log(message);
            res.status(200).render('login');
        })
        .catch(error => {
            //if the error message has an error code of 1 then render the register page with the error message
            if(error.code === 1)
                res.render('register',{error:error.message});
            else{
                //if the error doesnt have an error code then it means it wasn't wasn't caused by the form input
                //log the error and redirect to the register page
                console.error(error);
                res.redirect('/register');
            }
        });
});

router.get('/search', (req, res) => {
    const search = typeof req.query.value;

});

//get route that displays a profile to a user
router.get('/view/profile', (req, res) => {
    //If the query string of the request object is empty then redirect to discover/artists page
    if (Object.keys(req.query).length === 0)
        res.redirect('/discover/artists');
    //if the user clicked on their own profile, just redirect them to their profile page
    else if (typeof req.session.user !== 'undefined' && req.session.user.user === req.query.username)
        res.redirect('/users/profile');
    //Else get this users profile and render his profile page
    else {
        //get the name of the user profile
        const user = req.query.username;

        //if the username is undefined then redirect to the /discover/artists page
        if (typeof user === 'undefined')
            res.redirect('/dicover/artists');
        else {
            db.getUser(user)
                .then(record => res.render('view_profile', {
                    profile: {
                        username: record.username,
                        email: record.email,
                        account_type: record.account_type,
                        coverUrl: record.coverUrl,
                        profileUrl: record.profileUrl
                    }
                }))
                .catch(error => {
                    console.error(error);
                })
        }
    }
});
router.get('/view/playlists',(req,res)=>{
    //If the query string of the request object is empty then redirect to discover/artists page
    if (Object.keys(req.query).length === 0)
        res.redirect('/discover/artists');
    //if the user clicked on their own profile, just redirect them to their profile page
    else if (typeof req.session.user !== 'undefined' && req.session.user.user === req.query.username)
        res.redirect('/users/profile');
});

//post route that updates the views for a song
router.post('/updateView', (req, res) => {
    //get the current views from the page as well ass the song name
    const views = req.body.views;
    const songName = req.body.name;
    //update teh views for the song
    db.updateViews(songName, views);
    //return a status code 200 and end the response
    res.status(200).end();
});

module.exports = router;
