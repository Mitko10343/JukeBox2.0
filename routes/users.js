const express = require('express');
const router = express.Router();
const keys = require('../keys/keys');
const db = require('../custom_modules/firestore');
const multer = require('multer');
const uploads = multer({
    storage: multer.memoryStorage(),
}).any();
const loggedIn = (req, res, next) => {
    if (typeof req.session.user !== 'undefined')
        next();
    else
        res.redirect('/');
};


/* GET users listing. */
router.get('/', loggedIn, (req, res, next) => {
    res.render('index', {title: 'Users', user: req.session.user});
});

/*GET Profile PAGE*/
router.get('/profile', loggedIn, (req, res, next) => {
    res.render('profile', {user: req.session.user});

});
router.get('/profile/songs', loggedIn, (req, res, next) => {
    const username = req.session.user.user;

    db.getUserSongs(username, 10, 0).then(songData => {
        res.render('my_songs', {title: 'My Songs', user: req.session.user, songData});
    }).catch(error => console.error(error));
});

router.get('/spotify', loggedIn, (req, res, next) => {
    const username = req.session.user.user;
    const collection = req.session.user.account_type;
    db.getUser(username, collection)
        .then(user => {
            res.render('spotify', {user});
        });
});

router.get('/upload', loggedIn, (req, res, next) => {
    res.render('uploads', {user: req.session.user});
});

router.post('/upload', loggedIn, uploads, (req, res, next) => {
    if (typeof req.files === 'undefined' && typeof req.body === 'undefined')
        res.sendStatus(404).render('uploads');
    else {
        if (req.files[0].mimetype !== 'audio/mp3')
            console.error('Invalid Filetype Upload for song');
        else if (req.files[1].mimetype !== 'image/jpeg')
            console.error('Invalid Image filetype');
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

            db.uploadSong(req.files[0], req.files[1], songData).then(response => {
                res.status(200).redirect('profile');
            }).catch(err => console.log(`Error: ${err.message} ---users.js`));
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
            const account = req.session.user.account_type;
            db.uploadImg(user, keys.COVERS, req.files[0],req.files[0].originalname)
                .then(url => {
                    req.session.user.coverUrl = url;
                    return db.addImgUrl(user, account, url, keys.COVERURL);
                }).then(() => {
                res.status(200).render('profile', {user: req.session.user});
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
            const account = req.session.user.account_type;

            db.uploadImg(user, keys.PROFILES, req.files[0])
                .then(url => {
                    req.session.user.profileUrl = url;
                    return db.addImgUrl(user, account, url, keys.PROFILEURL);
                }).then(() => {
                res.status(200).render('profile', {user: req.session.user});
            }).catch(error => console.error(`Error: ${error.message} -users.js`));
        }
    }
});

module.exports = router;
