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
    res.render('index',{title:"Welcome"});
});


// Get Route that renders the discover music page
// Returns a JSON object with all the data of the songs to be played
router.get('/discover/music', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? undefined : req.session.user.user;
    //check if hte query is empty and if its no then return a refined list of Songs
    //check if hte query is empty and if its no then return a refined list of Songs
    if (Object.keys(req.query).length !== 0) {
        //Extract the parameters of the query string
        const genre = req.query.genre;
        const order = req.query.order;
        const page = typeof req.query.page !== 'undefined' ? req.query.page : 1;
        const pagination = typeof req.query.pagination !== 'undefined' ? req.query.pagination : 10;

        //Query the database for an ordered JSON object with song based on criteria from the front end
        if (genre === 'default' && order !== 'default')
            db.order(order)
                .then(songData => res.render('discover_music', {
                    songData,
                    user,
                    title:"Discover Music",
                }).end() )
                //in the case of an error return a status code of 500 and log the error
                .catch(error => {
                    console.error(error);
                    res.status(500).end();
                });
        else if (genre !== 'default' && order !== 'default')
            db.genreOrder(genre, order)
                .then(songData => res.render('discover_music', {songData,user}).end() )
                //in the case of an error return a status code of 500 and log the error
                .catch(error => {
                    console.error(error);
                    res.status(500).end();
                });
        else if (genre !== 'default' && order === 'default')
            db.getGenre(genre)
                .then(songData => res.render('discover_music', {songData,user}).end() )
                //in the case of an error return a status code of 500 and log the error
                .catch(error => {
                    console.error(error);
                    res.status(500).end();
                });
        else
            db.getSongs(pagination, page)
                .then(songData => res.render('discover_music', {songData,user}).end() )
                //in the case of an error return a status code of 500 and log the error
                .catch(error => {
                    console.error(error);
                    res.status(500).end();
                });
    }//end if

    //if the query string is empty just render the discover music page with an unordered list of the songs in the database
    db.getSongs(0, 1)
        .then(songData => res.render('discover_music', {songData,user}))
        //in the case of an error return a status code of 500 and log the error
        .catch(error => {
            console.error(error);
            res.status(500).end();
        });
});

router.get('/discover/artists', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? undefined : req.session.user;

    db.getArtists().then(artists => {
        res.render('discover_artists', {artists, user});
    }).catch(error => console.error(error));

});
//get route that renders the discover/playlist page
router.get('/discover/playlists', (req, res) => {
    //Check if a user session exists and if it doesnt set the user to undefined
    //this is done as a check
    //If a user session exists and the user doesn't have a certain playlist in his library, then an add button is rendered.
    const user = typeof req.session.user === 'undefined' ? undefined : req.session.user;
    //if user is undefined set add button to true else set it to false
    let add_button = typeof user === undefined;

    //Get all of the playlists in the database
    db.getAllPlaylists()
        .then(playlists => {
            //render the  discover playlists page
            res.render("discover_playlists", {
                playlists,
                user,
                add_button,
            })
        })
        .catch(error => {
            //in the case of an error log it and send a status of 500
            console.error(error);
            res.status(500).end();
        });
});

//get route that renders the tracks associated with a certain playlist
router.get('/discover/playlist/tracks', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    //check if the query string of the request object has the playlist name in it
    //if it doesnt then return a 400 status and end the response
    if (Object.keys(req.query).length === 0 && typeof req.query === 'undefined')
        res.status(400).end();

    //If the query string has some data in it then extract the playlist name from it
    const playlist_name = req.query.playlist_name;

    //Get the tracks for the playlist
    db.getPlaylistTracks(playlist_name)
    //If tracks are returned then render them on the page
        .then(tracks => {
            res.status(200).render("partials/discover_playlist_tracks", {
                playlist_name,
                songData: tracks,
                user
            });
        })
        .catch(error => {
            //in the case of an error log it and return a status of 500
            console.error(error);
            res.status(500).end();
        });//end promise
});//end route

//Get route that renders the store page
router.get('/store', (req, res) => {
    const user = typeof req.session.user === 'undefined' ? '' : req.session.user;
    res.render('store', {user});
});

//Get route that renders the login page
router.get('/login', notLoggedIn, (req, res) => {
    res.render('logIn',{title:'Login'});//render login page template
});//end route


//get route that renders the register page
router.get('/register', notLoggedIn, (req, res) => {
    res.render('register',{title:'Register'});//render the register page template
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
                res.redirect('/users');
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
            if (error.code === 1)
                res.render('register', {error: error.message});
            else {
                //if the error doesnt have an error code then it means it wasn't wasn't caused by the form input
                //log the error and redirect to the register page
                console.error(error);
                res.redirect('/register');
            }
        });
});

//get route that searches for a song
router.get('/search', (req, res) => {
    //get the search value from the search tab
    const search = req.query.value;

    //search for a song
    db.searchForSong(search)
        .then(songData => {
            console.log(songData);
            res.render('discover_music', {songData});
        })
        .catch(error => {
            console.error(error)
        })
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
            //get the user record
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
