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
const PLAYLISTS = db.collection(keys.PLAYLISTS);

/*Function that converts an array of firestore records into JSON objects*/
const extractData = async (data) => {
    let dataObj = [];

    for (let d of data)
        await dataObj.push(d.data());

    return dataObj;
};
const getSongData = async (tracks) => {
    let songData = [];
    for (let track of tracks) {
        await getSong(track.name)
            .then(song => {
                songData.push(song);
            })
            .catch(error => console.error(error));
    }

    return songData;
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

/**
 * Function that adds a user to firestore database
 * @param userData
 * @returns {Promise<any>}
 */
const registerUser = async (userData) => {
    //await for the promise to be resolved before returning
    return await new Promise((resolve, reject) => {
        //Check if a user record exists
        USERS.doc(userData.username).get()
            .then(record => {
                //if the record exists then return an error code of 1 + message
                if (record.exists)
                    reject({
                        code: 1,
                        message: `User ${userData.username} already has an account`,
                    });
                else
                    return addUserToDb(userData);
            })
            .then(response => {
                //if a response is returned then resolve promise
                resolve(response);
            })
            .catch(error => {
                //if and error is caught then reject the promise
                reject(error);
            });
    })//end promise
};//end function

/**
 * Asynchronous function that retrieves a user record
 * @param username
 * @returns {Promise<any>}
 */
const getUser = async (username) => {
    //wait for a promise to be resolved before returning to function
    return await new Promise((resolve, reject) => {
        //get the document for the username passed in
        USERS.doc(username).get()
            .then(record => {
                //if user record exists then resolve promise
                if (record.exists)
                    resolve(record.data());
                //if record is not found then reject the promise
                else
                    reject(`Record for ${username} not found`);
            })
            .catch(error => {
                //in the case of an error reject the promise
                reject(error);
            })
    })
};

//Get all songs
const getSong = async (name) => {
    return await new Promise((resolve) => {
        SONGS.doc(name).get()
            .then(songRecord => {
                resolve(songRecord.data())
            })
            .catch(error => console.error(error));
    })
};
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
const createPlaylist = async (user, playlist_name, thumbnailUrl) => {
    const add_to_playlist = PLAYLISTS.doc(playlist_name).set({
        playlist_name,
        original_owner: user,
        thumbnailUrl,
        likes: 0,
        shares: 0,
    });
    const add_to_users = USERS.doc(user).collection(keys.PLAYLISTS).doc(playlist_name).set({
        playlist_name,
        original_owner: user,
        thumbnailUrl,
    });
    return await Promise.all([add_to_playlist, add_to_users]).catch(error => console.error(error));
};
const getPlaylists = async (username) => {
    return await new Promise((resolve) => {
        USERS.doc(username).collection(keys.PLAYLISTS).limit(10).get()
            .then(playlists => {
                return extractData(playlists.docs);
            })
            .then(playlistData => {
                resolve(playlistData);
            })
            .catch(error => console.error(error));
    });
};
//Function that add a certain playlist into the collection of a user
const getPlaylist = async (playlist, user, shares) => {
    return await new Promise((resolve, reject) => {
        PLAYLISTS.doc(playlist).get()
            .then(record => {
                return record.data();
            })
            .then(p => {
                console.log(p);
                USERS.doc(user).collection(keys.PLAYLISTS).doc(playlist).set({
                    playlist_name: p.playlist_name,
                    original_owner: p.original_owner,
                    thumbnailUrl: p.thumbnailUrl,
                });

                PLAYLISTS.doc(p.name).set({
                    shares: +p.shares,
                }, {merge: true});
            })
            .then(() => resolve('Playlist added to user'))
            .catch(error => reject(error));
    });
};
/**
 *
 * @param name
 * @param owner
 * @returns {Promise<any>}
 */
const getPlaylistTracks = async (name, owner) => {
    return await new Promise((resolve) => {
        PLAYLISTS.doc(name).get()
            .then(records => {
                let data = records.data();
                if (typeof data.tracks === 'undefined')
                    resolve(undefined);
                else
                    return getSongData(data.tracks);
            }).then(songs => resolve(songs))
            .catch(error => console.error(error));
    });
};
//Function that adds a track to a playlist
//takes in 3 parameters
// song: which is the name of the track
// artist: is the artists of the song
// playlist: is the playlist the song is to be added to
const addTrack = async (song, artist, playlist) => {
    return await new Promise((resolve) => {
        PLAYLISTS.doc(playlist).update({
            tracks: admin.firestore.FieldValue.arrayUnion({
                name: song,
                artist
            })
        }).then(() => {
            resolve(`Track added successfully`)
        })
    })
};
/**
 *
 * @param artist
 * @param limit
 * @param page
 * @returns {Promise<any>}
 */
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

/**
 * Function that updates the view count of a song every time it is played
 * @param songName
 * @param views
 */
const updateViewsForSong = (songName, views) => {
    SONGS.doc(songName)
        .update({
            views: +views
        })
        .then(() => {
            console.log(`Views updated for songName`)
        })
        .catch(error => {
            console.error(error)
        });
};

/**
 * A function that uploads a song + song thumbnail to a storage bucket
 * @param mp3File
 * @param imgFile
 * @param songData
 * @returns {Promise<string|void>}
 */
const uploadSong = async (mp3File, imgFile, songData) => {
    //if the mp3 file and the image files are missing then return an error
    if (!mp3File && !imgFile)
        return 'Error: Some Files are not uploaded';

    //Clean some the song data
    const artist = songData.artist.replace(/ /g, '');
    const pathName = songData.songName.replace(/ /g, '');

    //Get a reference for the buckets where the mp3 and img files are going to be uploaded
    const mp3Bucket = bucket.file(`${keys.SONGS}/${artist}/${pathName}`);
    const thumbnailBucket = bucket.file(`${keys.THUMBNAILS}/${artist}/${pathName}`);

    //upload both files and return their public url upon success
    const imgUpload = uploadFile(imgFile, thumbnailBucket);
    const mp3Upload = uploadFile(mp3File, mp3Bucket);

    //await all promises to be resolved before returning a response
    return await Promise.all([mp3Upload, imgUpload])
        .then(values => {
            return addSongToDb(songData, values[0], values[1]);
        })
        .catch(err => {
            return err;
        });
};//end function

/**
 * Asynchronous Function that handles the upload of files
 * @param file
 * @param fileBucket
 * @returns {Promise<*>}
 */
const uploadFile = async (file, fileBucket) => {
    //return a promise
    return new Promise((resesolve, reject) => {
        //create a writable stream to the file bucket
        //and set some metadata for the file
        const uploadStream = fileBucket.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                uploaded: Date.now()
            }
        });

        //set an error handler in the case of an error
        uploadStream.on('error', error => {
            reject(error.message);
        });

        //set an on finish handler for when the write stream is finished
        uploadStream.on('finish', () => {
            //generate a url for the file
            const url = `https://storage.googleapis.com/${bucket.name}/${fileBucket.name}`;
            //create the url of the file public
            fileBucket.makePublic()
                .then(() => {
                    //resolve the promise and return url
                    resesolve(url);
                })
                .catch(error => {
                    //reject the promise in the case of an error
                    reject(error);
                });
        });
        //when the write stream is finished then close is
        uploadStream.end(file.buffer);
    });
};

/**
 * function that uploads an image file to a storage bucket and adds an entry for it in the database
 * @param user
 * @param collection
 * @param file
 * @param name
 * @returns {Promise<any>}
 */
const uploadImage = async (user, collection, file, name) => {
    //await for the a promise to be resolved before the function returns
    return await new Promise((resolve, reject) => {
        //if the file doesnt exist reject the promise with a message
        if (!file)
            reject('missing file');

        //Trim the username of the user and the name of the image file of any whitespaces
        const uname = user.replace(/ /g, '');
        name = name.replace(/ /g, '');

        //get a reference to the storage bucket
        const imageBucket = bucket.file(`${keys.USERS}/${uname}/${collection}/${name}`);

        //upload the image to the bucket
        uploadFile(file, imageBucket)
            .then(url => {
                //resolve the promise when the url returned
                resolve(url)
            })
            .catch(error => {
                //reject the promise in the case of an error
                reject(error)
            });
    })//end Promise
};//end function

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

//TODO: add pagination to the function
/**
 * Function that returns all the playlists from the playlist collection
 * @returns {Promise<any>}
 */
const getAllPlaylists = async () => {
    //await for the promise to be resolved before returning a value
    return await new Promise((resolve) => {
        //get 10 playlist from the database
        PLAYLISTS.limit(10).get()
            .then(playlists => {
                return extractData(playlists.docs);
            })
            .then(playlistData => {
                resolve(playlistData);
            })
            .catch(error => {
                //In the case of an error  log it
                console.error(error)
            });
    })
};

//Export all the functions from the firestore odule
module.exports.getPlaylist = getPlaylist;
module.exports.getAllPlaylists = getAllPlaylists;
module.exports.addTrack = addTrack;
module.exports.getPlaylistTracks = getPlaylistTracks;
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