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
router.get('/', loggedIn, (req, res, next) => {
    res.render('index', {title: 'Users', user: req.session.user});
});
/*GET Profile PAGE*/
router.get('/profile', loggedIn, (req, res, next) => {
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
router.get('/profile/songs', loggedIn, (req, res, next) => {
    const username = req.session.user.user;

    db.getUserSongs(username, 10, 0).then(songData => {
        res.render('my_songs', {title: 'My Songs', user: req.session.user, songData});
    }).catch(error => console.error(error));
});
router.get('/profile/playlists', loggedIn, (req, res) => {
    db.getUserPlaylists(req.session.user.user)
        .then(playlists=>{
            res.render('playlists',{playlists,user:req.session.user});
        }).catch(error=>{
            console.error(error);
            res.render('playlists',{user:req.session.user});
    });
});
router.get('/playlist/tracks',loggedIn,(req,res)=>{
    if(Object.keys(req.query).length === 0 && typeof  req.query === 'undefined'){
        res.status(400).end();
    }

    const playlist_name = req.query.playlist_name;
    const owner = req.query.owner;

    db.getPlaylistTracks(playlist_name,owner)
        .then(tracks =>{
            res.status(200).render("playlist_tracks",{playlist_name,songData:tracks});
        }).catch(error=>{
            res.status(500).end();
    });
});
router.get('/playlist/getSongs',loggedIn,(req,res)=>{
    db.getSongs(0,0).then(songs=>{
        res.status(200).send(songs).end();
    }).catch(error=>{
        console.error(error);
    })
});
router.post('/playlist/addSong',loggedIn,(req,res)=>{
    db.addTrack(req.body.name,req.body.artist,req.body.playlist,req.session.user.user)
        .then((tracks)=>res.redirect('/users/profile/playlists'))
        .catch(error=>console.error(error));
});
router.get('/profile/design', (req, res) => {
    res.render('design.ejs');
});

router.post('/createPlaylist',loggedIn,uploads,(req,res,next)=>{
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('uploads');
    else {
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png')
            console.error('Invalid image type of thumbnail');
        else {
            db.uploadImg(req.session.user.user,keys.THUMBNAILS,req.files[0],req.files[0].originalname)
                .then(url=>{
                    db.createPlaylist(req.session.user.user,req.body.playlist_name,url)
                        .then(res.redirect('/users/profile/playlists'));
                }) .catch(error=>console.error(error));
        }
    }
});

//GET REQUEST TO USER SPOTIFY PAGE
router.get('/spotify', loggedIn, (req, res, next) => {
    const username = req.session.user.user;
    db.getUser(username)
        .then(user => {
            res.render('spotify', {user, token: req.session.user.spotify_acces_token});
        });
});
router.get('/spotifyConnect', loggedIn, (req, res) => {
    res.redirect(spotify.getAuthUrl);
});
router.get('/spotifyAuth', loggedIn, (req, res, next) => {
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
router.get('/spotifyPlaylist', loggedIn, (req, res, next) => {
    spotify.getPlaylists()
        .then(playlists => {
            const playlist = JSON.parse(playlists);
            console.log(playlist.items);
            res.render("spotify_playlists",{user:req.session.user,playlist:playlist.items});
        }).catch(error => console.error(error));
});
//Refracto it so it returns only the track ids
router.get('/spotify/playlist/tracks',loggedIn,(req,res,next)=>{
   if(Object.keys(req.query).length === 0 && typeof req.query === 'undefined'){
       res.status(400).end();
   }

   const playlist_id = req.query.playlist_id;
   spotify.getPlaylistTracks(playlist_id)
       .then(tracks=>{
           res.send(tracks.items).end();
       }).catch(error=>{
           console.error(error);
   })


});

//GETS THE UPLOAD PAGE
router.get('/upload', loggedIn, (req, res, next) => {
    res.render('uploads', {user: req.session.user});
});
//POST ROUTES
router.post('/upload', loggedIn, uploads, (req, res, next) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('uploads',{user:req.session.user});
    else {
        if (req.files[0].mimetype !== 'audio/mp3')
            console.error('Invalid ile type of song');
        else if (req.files[1].mimetype !== 'image/jpeg' && req.files[1].mimetype !== 'image/png')
            console.error('Invalid image type of thumbnail');
        else {
            const album = typeof req.body.albumName === 'undefined' ? '' : req.body.albumName;
            const songData = {
                artist: req.session.user.user,
                songName: req.body.songName,
                genre: req.body.genre,
                views: 0,
                likes: 0,
                album,
            };

            db.uploadSong(req.files[0], req.files[1], songData)
                .then(response => {
                    res.status(200).redirect('upload');
                })
                .catch(err => console.log(`Error: ${err.message} ---users.js`));
        }
    }
});
router.post('/uploadCover', loggedIn, uploads, (req, res, next) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('profile', {user: req.session.user});
    else {
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png') {
            console.log("Invalid Image format");
        } else {
            const user = req.session.user.user;
            db.uploadImg(user, keys.COVERS, req.files[0],req.files[0].originalname)
                .then(url => {
                    req.session.user.coverUrl = url;
                    return db.addImgUrl(user, url, keys.COVERURL);
                }).then(() => {
                    console.log(req.session.user.coverUrl);
                res.status(200).redirect('profile');
            }).catch(error => console.error(`Error: ${error.message} -users.js`));
        }
    }
});
router.post('/uploadProfile', loggedIn, uploads, (req, res, next) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('profile', {user: req.session.user});
    else {
        if (req.files[0].mimetype !== 'image/jpeg' && req.files[0].mimetype !== 'image/png') {
            console.log("Invalid Image format");
        } else {
            const user = req.session.user.user;

            db.uploadImg(user, keys.PROFILES, req.files[0],req.files[0].originalname)
                .then(url => {
                    req.session.user.profileUrl = url;
                    return db.addImgUrl(user, url, keys.PROFILEURL);
                }).then(() => {
                res.status(200).redirect('profile');
            }).catch(error => console.error(`Error: ${error.message} -users.js`));
        }
    }
});

module.exports = router;
