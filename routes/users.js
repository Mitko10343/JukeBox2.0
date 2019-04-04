const express = require('express');
const spotify = require('../custom_modules/spotify');
const router = express.Router();
const keys = require('../keys/keys');
const db = require('../custom_modules/firestore');
const multer = require('multer');
const uploads = multer({
    storage: multer.memoryStorage(),
}).any();

//Authentication function
const loggedIn = (req, res, next) => {
    if (typeof req.session.user !== 'undefined')
        next();
    else
        res.redirect('/login');
};

/* GET users listing. */
router.get('/', loggedIn, (req, res) => {
    res.render('index', {title: 'Users', user: req.session.user});
});
/*GET Profile PAGE*/
router.get('/profile', loggedIn, (req, res) => {
    db.getUser(req.session.user.user)
        .then(record => {
            res.render('profile', {
                user: {
                    username: record.username,
                    email: record.email,
                    account_type: record.account_type,
                    coverUrl: record.coverUrl,
                    profileUrl: record.profileUrl
                }
            });
        })
});
//GET REQUEST FOR TO LIST USERS SONGS
router.get('/profile/songs', loggedIn, (req, res) => {
    const username = req.session.user.user;

    db.getUserSongs(username, 10, 0).then(songData => {
        res.render('my_songs', {title: 'My Songs', user: req.session.user, songData});
    }).catch(error => console.error(error));
});
router.get('/profile/playlists', loggedIn, (req, res) => {
    db.getUserPlaylists(req.session.user.user)
        .then(playlists => {
            res.render('playlists', {playlists, user: req.session.user, add_button: false});
        }).catch(error => {
        console.error(error);
        res.render('playlists', {user: req.session.user});
    });
});
router.get('/playlist/tracks', loggedIn, (req, res) => {
    if (Object.keys(req.query).length === 0 && typeof req.query === 'undefined') {
        res.status(400).end();
    }

    const playlist_name = req.query.playlist_name;
    const owner = req.query.owner;

    db.getPlaylistTracks(playlist_name, owner)
        .then(tracks => {
            res.status(200).render("playlist_tracks", {playlist_name, songData: tracks});
        }).catch(error => {
        res.status(500).end();
    });
});
router.get('/playlist/getSongs', loggedIn, (req, res) => {
    db.getSongs(0, 0).then(songs => {
        res.status(200).send(songs).end();
    }).catch(error => {
        console.error(error);
    })
});
router.get('/getPlaylist', loggedIn, (req, res) => {
    if (Object.keys(req.query).length === 0 && typeof req.query === 'undefined') {
        res.status(500).end();
    }

    let playlist = req.query.playlist_name;
    let owner = req.query.owner;
    let userSession = req.session.user.user;
    let shares = req.query.shares;

    if (owner === userSession) {
        res.stat(200).send('This playlist already belongs to you!').end();
    } else {
        db.getPlaylist(playlist, userSession, shares)
            .then(() => {
                res.status(200).send(`Playlist ${playlist} added to your collection!`);
            })
            .catch(error => {
                console.error(error);
            });
    }
});
router.post('/playlist/addSong', loggedIn, (req, res) => {
    db.addTrack(req.body.name, req.body.artist, req.body.playlist, req.session.user.user)
        .then((tracks) => res.redirect('/users/profile/playlists'))
        .catch(error => console.error(error));
});

router.post('/createPlaylist', loggedIn, uploads, (req, res) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('uploads');
    else {
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png')
            console.error('Invalid image type of thumbnail');
        else {
            db.uploadImg(req.session.user.user, keys.THUMBNAILS, req.files[0], req.files[0].originalname)
                .then(url => {
                    db.createPlaylist(req.session.user.user, req.body.playlist_name, url)
                        .then(res.redirect('/users/profile/playlists'));
                }).catch(error => console.error(error));
        }
    }
});
//GET REQUEST TO USER SPOTIFY PAGE
router.get('/spotify', loggedIn, (req, res) => {
    const username = req.session.user.user;
    db.getUser(username)
        .then(user => {
            res.render('spotify', {user, token: req.session.user.spotify_acces_token});
        });
});
router.get('/spotifyConnect', loggedIn, (req, res) => {
    res.redirect(spotify.getAuthUrl);
});
router.get('/spotifyAuth', loggedIn, (req, res) => {
    const code = req.query.code;
    const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
            code,
            redirect_uri: spotify.redirectUrl,
            grant_type: "authorization_code"
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify.clientId + ':' + spotify.clientSecret).toString('base64'))
        },
        json: true
    };

    spotify.setToken(authOptions).then(tokens => {
        req.session.user.spotify_acces_token = tokens.access_token;
        res.redirect('/users/spotify');
    }).catch(error => console.error);
});
router.get('/spotifyPlaylist', loggedIn, (req, res) => {
    spotify.getPlaylists()
        .then(playlists => {
            const playlist = JSON.parse(playlists);
            console.log(playlist.items);
            res.render("spotify_playlists", {user: req.session.user, playlist: playlist.items});
        }).catch(error => console.error(error));
});
//Refractor it so it returns only the track ids
router.get('/spotify/playlist/tracks', loggedIn, (req, res) => {
    if (Object.keys(req.query).length === 0 && typeof req.query === 'undefined') {
        res.status(400).end();
    }

    const playlist_id = req.query.playlist_id;
    spotify.getPlaylistTracks(playlist_id)
        .then(tracks => {
            res.send(tracks.items).end();
        }).catch(error => {
        console.error(error);
    })


});

//Get route that renders the uploads page
router.get('/upload', loggedIn, (req, res) => {
    res.render('uploads', {
        user: req.session.user
    });
});

//Post route that uploads a song to a firebase storage bucket and also adds a
//data entry in the corresponding firestore collection
router.post('/upload', loggedIn, uploads, (req, res) => {
    //Check if the req.files field of the request object is empty and if it is throw an error
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.status(500).send(`No files selected for uploads`).end();
    else {
        //check if the song file to be uploaded has the correct mime type
        //throw an error if it doesnt
        if (req.files[0].mimetype !== 'audio/mp3')
            res.status(500).send(`Invalid mime type for the song to be uploaded.
                                    expected audio/mp3, but got ${req.files[0].mimetype}`);
        //check the mimetype of the thumbnail for the song is valid and if its not then throw and error
        else if (req.files[1].mimetype !== 'image/jpeg' && req.files[1].mimetype !== 'image/png')
            res.status(500).send(`Invalid mime type for the thumbnail to be uploaded
                                    expected image/jpeg or image/png, but go
                                    ${req.files[1].mimetype} instead`);
        else {
            //check if the album field has been set, if not just set it to an empty string
            const album = typeof req.body.albumName === 'undefined' ? '' : req.body.albumName;
            //create a JSON Object for the song data
            const songData = {
                artist: req.session.user.user,
                songName: req.body.songName,
                genre: req.body.genre,
                views: 0,
                likes: 0,
                album,
            };
            //Upload the song to the firestore bucked and the corresponding firestore collection
            db.uploadSong(req.files[0], req.files[1], songData)
                .then(() => {
                    //upon success send status 200 + success message
                    res.status(200).send(`Song uploaded successfully`);
                })
                .catch(error => {
                    //in the case of an error log the error message
                    console.error(error);
                });//end promise
        }//end else
    }//end else
});//end route

//post route that uploads the currently logged in user's cover picture to a a firebase storage bucket
//and adds an entry in the corresponding user record in the firestore database
router.post('/uploadCover', loggedIn, uploads, (req, res) => {
    //if the req.files field in the request object is empty then throw an error
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).send(`No file selected for upload`).end();
    else {
        //if the mime type of the image file is not valid then throw an error
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png') {
            res.status(500).send(`Invalid mime type of the file. Expected file
                                    with type image/jpeg or image/png 
                                  and received ${req.files[0].mimetype}instead`).end();
        } else {
            //get the username of the current user that is logged in
            const user = req.session.user.user;
            //upload the image to the firestore bucket
            db.uploadImg(user, keys.COVERS, req.files[0], req.files[0].originalname)
            //upon success return the public url to the image
                .then(url => {
                    //set the url of the image to the current user session
                    req.session.user.coverUrl = url;
                    //add the img url to the user record in the database
                    return db.addImgUrl(user, url, keys.COVERURL);
                })
                .then(() => {
                    //redirect the user to the profile page
                    res.status(200).redirect('profile');
                })
                .catch(error => {
                    //in the case of an error log
                    console.error(error)
                });//end promise
        }//end elese
    }//end else
});//end route

//post route that uploads the currently logged in user's profile picture to a firebase storage bucket
//and adds an entry in the corresponding user record in the firestore database
router.post('/uploadProfile', loggedIn, uploads, (req, res) => {
    //if the req.files field in the request object is empty then throw an error
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).send(`No file selected for upload`).end();
    else {
        //if the mime type of the image file is not valid then throw an error
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png') {
            res.status(500).send(`Invalid mime type of the file. Expected file
                                    with type image/jpeg or image/png 
                                  and received ${req.files[0].mimetype}instead`).end();
        } else {
            //get the username of the current user that is logged in
            const user = req.session.user.user;
            //upload the image to the firestore bucket
            db.uploadImg(user, keys.PROFILES, req.files[0], req.files[0].originalname)
            //upon success return the public url to the image
                .then(url => {
                    //set the url of the image to the current user session
                    req.session.user.profileUrl = url;
                    //add the img url to the user record in the database
                    return db.addImgUrl(user, url, keys.PROFILEURL);
                })
                .then(() => {
                    //redirect the user to the profile page
                    res.status(200).redirect('profile')
                })
                .catch(error => {
                    //in the case of an error log
                    console.error(error);
                });//end promise
        }//end else
    }//end else
});//end route

//get route that destroys the current session and logs the user out
router.get('/logout', loggedIn, (req, res) => {
    //destroy the current user session
    req.session.destroy();
    //redirect the user to the login page
    res.redirect('/login');
});//end route

//get route that adds a song to a users likes
router.get('/like', loggedIn, (req, res) => {
    //check if the query string of the request object contains is empty
    //if it is then return a status code of 500
    if (typeof req.query === 'undefined' || Object.keys(req.query).length === 0) {
        res.status(500).end();
    }

    //if the req.query has some contents then extract the name of the song
    const song_name = req.query.song_name;
    //get the current likes of the song and increment them by one
    const likes = parseInt(req.query.likes) + 1;
    //get the currently logged in user's username
    const username = req.session.user.user;

    //add the user to as part of the likes of the song and also add the song the the users likes
    db.addToLikes(song_name, username, likes)
        .then(() => {
            res.status(200).end();
        })
        .catch(error => {
            //in the case of an error then log it
            console.error(error);
        })
});//end route

//get route that adds a song to a users likes
router.get('/unlike', loggedIn, (req, res) => {
    //check if the query string of the request object contains is empty
    //if it is then return a status code of 500
    if (typeof req.query === 'undefined' || Object.keys(req.query).length === 0) {
        res.status(500).end();
    }

    //if the req.query has some contents then extract the name of the song
    const song_name = req.query.song_name;
    //get the current likes of the song and decrement them by one
    const likes = parseInt(req.query.likes) - 1;
    //get the currently logged in user's username
    const username = req.session.user.user;


    //remove the song from the users likes and remove the user from the people who like the song
    db.unlikeSong(song_name, username, likes)
        .then(() => {
            res.status(200).end();
        })
        .catch(error => {
            //in the case of an error then log it
            console.error(error);
        })
});//end route


//Get route that renders the design tool page
router.get('/profile/design', loggedIn, (req, res) => {
    //first of all get the data from the user record
    db.getUser(req.session.user.user)
        .then(data => {
            //if the data is returned check if the user has any uploaded decals
            if(typeof  data.decals === 'undefined' || Object.keys(data.decals).length === 0){
                let decals = undefined;
                res.render('design',{decals});
            }else{
                let decals = data.decals;
                res.render('design',{decals});
            }
        })
        .catch(error => {
            console.error(error);
        })

});

router.post('/decals/upload', loggedIn, uploads, (req, res) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).send(`No file selected for upload`).end();
    else {
        //if the mime type of the image file is not valid then throw an error
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png') {
            res.status(500).send(`Invalid mime type of the file. Expected file
                                    with type image/jpeg or image/png 
                                  and received ${req.files[0].mimetype}instead`).end();
        } else {
            //get the username of the current user that is logged in
            const user = req.session.user.user;
            //upload the image to the firestore bucket
            db.uploadImg(user, keys.DECALS, req.files[0], req.files[0].originalname)
            //upon success return the public url to the image
                .then(url => {
                    //add the decal url to the user record
                    return db.addDecalUrl(user, url, req.files[0].originalname);
                })
                .then(() => {
                    //redirect the user to the profile page
                    res.status(200).redirect('/users/profile/design');
                })
                .catch(error => {
                    //in the case of an error log
                    console.error(error)
                });//end promise
        }//end elese
    }//end else
});


//export the routes
module.exports = router;

