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

/*Function that converts an array of firestore records into JSON objects*/
const extractData = async (data) => {
    let dataObj = [];

    for (let d of data)
        await dataObj.push(d.data());

    return dataObj;
};

/*FUNCTION TO ADD A USER TO THE DATABASE*/
const registerUser = async (userData) => {
    return await new Promise((resolve,reject) =>{
        getUserRecord(userData.username,userData.account_type)
            .then(response=>{
                if(response === false)
                    db.collection(keys.USERS).doc(userData.username).set({
                        username:userData.username,
                        email: userData.email,
                        password: userData.password,
                        account_type: userData.account,
                    },{merge:false}).then(()=>{
                        resolve( {
                            code:1,
                            message:`Added user ${userData.username}`
                        });
                    });
                else {
                    reject( {
                        code:-1,
                        message:`User already exists`
                    });
                }
            }).catch(error=>{
            console.error(error);
        });
    })
};

const getUserRecord = async (username,collection)=>{
    return await db.collection(collection).doc(username).get()
        .then(record=>{
            if(record.exists){
                return record.data();
            }else{
                return false;
            }
        }).catch(error=>{
            console.error(error);
        })
};

const getSongs = async (limit, page) => {
    limit = limit === 0 ? 10: limit;
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

const updateViewsForSong = (songName, views) => {
    db.collection(keys.SONGS).doc(songName).set({views: +views}, {merge: true})
        .catch(error=>console.error(error));
};

module.exports.updateViews = updateViewsForSong;
module.exports.registerUser = registerUser;
module.exports.getUser = getUserRecord;
module.exports.getSongs = getSongs;