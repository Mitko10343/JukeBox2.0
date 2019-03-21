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

/*Function that converts an array of firestore records into JSON objects*/
const extractData = async (data) => {
    let dataObj = [];

    for (let d of data)
        await dataObj.push(d.data());

    return dataObj;
};
const getSongData = async (refs) => {
    let songData = [];

    for (let ref of refs) {
        await db.collection(keys.SONGS).doc(ref.name).get()
            .then(data => songData.push(data.data()))
            .catch(error => console.error(error));
    }

    return songData;
};

/*FUNCTION TO ADD A USER TO THE DATABASE*/
const registerUser = async (userData) => {
    return await new Promise((resolve, reject) => {
        getUserRecord(userData.username, userData.account_type)
            .then(response => {
                if (response === false)
                    db.collection(userData.account_type).doc(userData.username).set({
                        username: userData.username,
                        email: userData.email,
                        password: userData.password,
                        account_type: userData.account_type,
                    }, {merge: false}).then(() => {
                        resolve({
                            code: 1,
                            message: `Added user ${userData.username}`
                        });
                    });
                else {
                    reject({
                        code: -1,
                        message: `User already exists`
                    });
                }
            }).catch(error => {
            console.error(error);
        });
    })
};
const getUserRecord = async (username, collection) => {
    return await db.collection(collection).doc(username).get()
        .then(record => {
            if (record.exists) {
                return record.data();
            } else {
                return false;
            }
        }).catch(error => {
            console.error(error);
        })
};
const getSongs = async (limit, page) => {
    limit = limit === 0 ? 10 : limit;
    page = page === 0 ? 1 : page;

    return await db.collection(keys.SONGS).limit(limit, page).get()
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
const getUserSongs = async (user, limit, page) => {
    return await new Promise((resolve, reject) => {
        db.collection(keys.ARTIST).doc(user).collection(keys.SONGS).limit(limit).get()
            .then(songRecords => {
                return extractData(songRecords.docs);
            }).then(songsRefs => {
            return getSongData(songsRefs);
        }).then(songData => {
            resolve(songData);
        }).catch(error => {
            reject(error);
        })
    });
};
const updateViewsForSong = (songName, views) => {
    db.collection(keys.SONGS).doc(songName).set({views: +views}, {merge: true})
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
            return addSong(songData, values[0], pathName, values[1]);
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
const uploadImage = async(user,collection,file,filename)=>{
    return await new Promise((resolve,reject)=>{
        if(!file && !collection)
            reject('missing file or bucket name');

        const uname = user.replace(/ /g, '');
        const imageBucket = bucket.file(`${collection}/${uname}/${filename}`);

        uploadFile(file,imageBucket)
            .then(url=>resolve(url))
            .catch(err=>reject(err));
    })
};

//First add a song reference in the songs collection
//Then add a song reference to the artist document
const addSong = async (songData, mp3url, pathName, thumbnailUrl) => {
    const songDocRef = db.collection(keys.SONGS).doc(songData.songName);
    const artistDocRef = db.collection(keys.ARTIST).doc(songData.artist).collection(keys.SONGS).doc(pathName);

    songDocRef.set({
        name: songData.songName,
        album: songData.album,
        artist: songData.artist,
        views: songData.views,
        likes: songData.likes,
        mp3url,
        thumbnailUrl,
        uploadDate: Date.now(),
        path: `${songData.artist}/${pathName}`
    }).then(() =>
        artistDocRef.set({
            name: songData.songName,
            reference: `${keys.SONGS}/${songData.songName}`,
        }))
        .catch(err => {
            return err;
        });
};
const addImgUrl = async(user,collection,url,imgType)=>{
    if(imgType === keys.COVERURL){
        return await new Promise((resolve,reject)=>{
            db.collection(collection).doc(user).set({
                coverUrl:url,
            },{merge:true}).then(()=>{
                resolve();
            }).catch(error=>{
                reject(error);
            })
        });
    }else{
        return await new Promise((resolve,reject)=>{
            db.collection(collection).doc(user).set({
                profileUrl:url,
            },{merge:true}).then(()=>{
                resolve();
            }).catch(error=>{
                reject(error);
            })
        });
    }

};


/*Functions that are used when refining songs in discover*/
const order = async (order) => {
    let orderBy = '';
    let direction ='asc';

    if (order === 'NewToOld' || order === "OldToNew") {
        orderBy = 'uploadDate';
        if (order === 'NewToOld')
            direction = 'desc'
    } else if (order === 'UnPopToPop' || order === 'PopToUnPop') {
        orderBy = 'views';
        if (order === 'PopToUnPop')
            direction = 'desc'
    }

    console.log(direction);
    console.log(orderBy);
    return await db.collection(keys.SONGS).orderBy(orderBy, direction).get()
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

    return await db.collection(keys.SONGS).where('genre', '==', genre).orderBy(orderBy, direction).get()
        .then(data => {
            return extractData(data.docs)
        })
        .then(songData => {
            return songData;
        }).catch(err => console.error(`Error: ${err}`));
};
const getGenre = async (genre) => {
    return await db.collection(keys.SONGS).where('genre', '==', genre).get()
        .then(data => {
            return extractData(data.docs)
        })
        .then(songData => {
            return songData;
        }).catch(err => console.error(`Error: ${err}`));
};


module.exports.addImgUrl = addImgUrl;
module.exports.uploadImg = uploadImage;
module.exports.genreOrder =genreOrder;
module.exports.order = order;
module.exports.getGenre =getGenre;
module.exports.uploadSong = uploadSong;
module.exports.updateViews = updateViewsForSong;
module.exports.registerUser = registerUser;
module.exports.getUser = getUserRecord;
module.exports.getSongs = getSongs;
module.exports.getUserSongs = getUserSongs;