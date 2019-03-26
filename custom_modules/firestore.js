const admin = require('firebase-admin');
const serviceAccount = require('../keys/finalyearproject-a8f42-firebase-adminsdk-mjvjb-eeb393f285');
const keys = require('../keys/keys');

//Initialize the connection to the firestore database
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://finalyearproject-a8f42.firebaseio.com",
    storageBucket: "finalyearproject-a8f42.appspot.com"
});

//get an instance of the database
const db = admin.firestore();
const bucket = admin.storage().bucket();
const USERS = db.collection(keys.USERS);
const SONGS = db.collection(keys.SONGS);

/*Function that converts an array of firestore records into JSON objects*/
const extractData = async (data) => {
    let dataObj = [];

    for (let d of data)
        await dataObj.push(d.data());

    return dataObj;
};
const addUserToDb = async (userData) => {
    return await new Promise((resolve, reject) => {
        USERS.doc(userData.username).set({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            account_type: userData.account_type,
        }).then(() => {
            resolve(`Added user ${userData.username}`);
        }).catch(error => {
            reject(error);
        });
    })
};
const addSongToDb = async (songData, mp3url, thumbnailUrl) => {
    const songDocRef = db.collection(keys.SONGS).doc(songData.songName);

    songDocRef.set({
        name: songData.songName,
        album: songData.album,
        artist: songData.artist,
        views: songData.views,
        likes: songData.likes,
        mp3url,
        thumbnailUrl,
        uploadDate: Date.now(),
    }).catch(err => {
        console.error(err);
    });
};

/*FUNCTION TO ADD A USER TO THE DATABASE*/
const registerUser = async (userData) => {
    return await new Promise((resolve, reject) => {
        //Check if a user record exists
        getUser(userData.username).then(response => {
            addUserToDb(userData).then(message => resolve(message)).catch(error => reject(error));
        }).catch(error => {
            reject(`User already has an account`);
        });
    })
};
const getUser = async (username) => {
    return await new Promise((resolve, reject) => {
        USERS.doc(username).get()
            .then(record => {
                resolve(record.data());
            })
            .catch(error => {
                reject(error);
            })
    })
};

//Get all songs
const getSongs = async (limit, page) => {
    limit = limit === 0 ? 10 : limit;
    page = page === 0 ? 1 : page;

    return await SONGS.limit(limit, page).get()
        .then(songs => {
            return extractData(songs.docs);
        })
        .then(songData => {
            return songData
        })
        .catch(err => {
            return err
        });
};
const createPlaylist = async(uname,pname,thumbnailUrl)=>{
    USERS.doc(uname).collection(keys.PLAYLISTS).doc(pname).set({
        thumbnailUrl,
        name:pname,
    });
    return Promise.resolve();
};
const getPlaylists = async (username)=>{
    return await new Promise((resolve,reject) => {
        USERS.doc(username).collection(keys.PLAYLISTS).limit(10).get()
            .then(playlists=>{
                if(playlists.exists)
                    return extractData(playlists.docs);
                else
                    reject('No Playlist found');
            })
            .then(playlistData=>{
                resolve(playlistData);
            })
            .catch(error=>console.error(error));
    });
};
const getUserSongs = async (artist, limit, page) => {
    return await new Promise((resolve, reject) => {
        SONGS.where('artist', '==', artist)
            .limit(limit).get()
            .then(songRecords => {
                return extractData(songRecords.docs);
            })
            .then(songData => {
                console.log(JSON.stringify(songData));
                resolve(songData);
            })
            .catch(error => {
                reject(error);
            })
    });
};

const updateViewsForSong = (songName, views) => {
    SONGS.doc(songName)
        .set({
            views: +views
        }, {merge: true})
        .then(() => console.log(`Views updated for songName`))
        .catch(error => console.error(error));
};
const uploadSong = async (mp3File, imgFile, songData) => {
    if (!mp3File && !imgFile)
        return 'Error: Some Files are not uploaded';
    //Clean some the song data
    const artist = songData.artist.replace(/ /g, '');
    const pathName = songData.songName.replace(/ /g, '');
    //Get a reference for the buckets wherer the mp3 and img files are going to be uploaded
    const mp3Bucket = bucket.file(`${keys.SONGS}/${artist}/${pathName}`);
    const thumbnailBucket = bucket.file(`${keys.THUMBNAILS}/${artist}/${pathName}`);
    //upload both files and return their public url upon success
    const imgUpload = uploadFile(imgFile, thumbnailBucket);
    const mp3Upload = uploadFile(mp3File, mp3Bucket);

    return await Promise.all([mp3Upload, imgUpload])
        .then(values => {
            return addSongToDb(songData, values[0], values[1]);
        })
        .catch(err => {
            return err;
        });
};

//Asynchronous Function that handles the upload of files
//returns the public url of the asset upon success
//returns an error if it encounters one
const uploadFile = async (file, fileBucket) => {
    return new Promise((resesolve, reject) => {
        const uploadStream = fileBucket.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                uploaded: Date.now()
            }
        });
        uploadStream.on('error', error => {
            reject(error.message);
        });
        uploadStream.on('finish', () => {
            const url = `https://storage.googleapis.com/${bucket.name}/${fileBucket.name}`;
            fileBucket.makePublic().then(() => {
                resesolve(url);
            }).catch(error => {
                reject(error);
            });
        });
        uploadStream.end(file.buffer);
    });
};
const uploadImage = async (user,collection,file,name) => {
    return await new Promise((resolve, reject) => {
        if (!file)
            reject('missing file');


        const uname = user.replace(/ /g, '');
        name = name.replace(/ /g,'');
        const imageBucket = bucket.file(`${keys.USERS}/${uname}/${collection}/${name}`);

        uploadFile(file, imageBucket)
            .then(url => resolve(url))
            .catch(err => reject(err));
    })
};

//First add a song reference in the songs collection
//Then add a song reference to the artist document
const addImgUrl = async (user, url, imgType) => {
    if (imgType === keys.COVERURL) {
        return await new Promise((resolve, reject) => {
            USERS.doc(user).set({
                coverUrl: url,
            }, {merge: true}).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            })
        });
    } else {
        return await new Promise((resolve, reject) => {
            USERS.doc(user).set({
                profileUrl: url,
            }, {merge: true}).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            })
        });
    }
};

/*Functions that are used when refining songs in discover*/
const order = async (order) => {
    let orderBy = '';
    let direction = 'asc';

    if (order === 'NewToOld' || order === "OldToNew") {
        orderBy = 'uploadDate';
        if (order === 'NewToOld')
            direction = 'desc'
    } else if (order === 'UnPopToPop' || order === 'PopToUnPop') {
        orderBy = 'views';
        if (order === 'PopToUnPop')
            direction = 'desc'
    }

    return await SONGS.orderBy(orderBy, direction).get()
        .then(data => {
            return extractData(data.docs)
        })
        .then(songData => {
            return songData;
        }).catch(err => console.error(`Error: ${err}`));
};
const genreOrder = async (genre, order) => {
    let orderBy = '';
    let direction = 'asc';

    if (order === 'NewToOld' || order === "OldToNew") {
        orderBy = 'uploadDate';
        if (order === 'OldToNew')
            direction = 'desc'
    } else if (order === 'UnPopToPop' || order === 'PopToUnPop') {
        orderBy = 'views';
        if (order === 'PopToUnPop')
            direction = 'desc'
    }

    return await SONGS.where('genre', '==', genre).orderBy(orderBy, direction).get()
        .then(data => {
            return extractData(data.docs)
        })
        .then(songData => {
            return songData;
        }).catch(err => console.error(`Error: ${err}`));
};
const getGenre = async (genre) => {
    return await SONGS.where('genre', '==', genre).get()
        .then(data => {
            return extractData(data.docs)
        })
        .then(songData => {
            return songData;
        }).catch(err => console.error(`Error: ${err}`));
};

const getArtists = async () => {
    return await new Promise((resolve, reject) => {
        USERS.where('account_type', '==', 'artists').get()
            .then(artists => {
                return extractData(artists.docs);
            })
            .then(artistsData => {
                resolve(artistsData);
            }).catch(error => {
            reject(error);
        })
    });
};


module.exports.getUserPlaylists = getPlaylists;
module.exports.createPlaylist = createPlaylist;
module.exports.getArtists = getArtists;
module.exports.addImgUrl = addImgUrl;
module.exports.uploadImg = uploadImage;
module.exports.genreOrder = genreOrder;
module.exports.order = order;
module.exports.getGenre = getGenre;
module.exports.uploadSong = uploadSong;
module.exports.updateViews = updateViewsForSong;
module.exports.registerUser = registerUser;
module.exports.getUser = getUser;
module.exports.getSongs = getSongs;
module.exports.getUserSongs = getUserSongs;