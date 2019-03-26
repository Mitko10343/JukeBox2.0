const Spotify = require('spotify-web-api-node');
const request = require('request');
const spotifyAPI =new Spotify({
    clientId:'0569022ffbab42f48e35a663eff9e3a0',
    clientSecret:'d6a365a138794055ab603422d883a6e6',
    redirectUri:'http://127.0.0.1:3000/users/spotifyAuth'
});
const scope = ["user-read-private","user-read-email"];
const state = 'code';




const getPlaylist = async ()=>{
    return await new Promise((resolve,reject) => {
        request.get({
            url:'https://api.spotify.com/v1/me/playlists',
            headers:{
                'Authorization':`Bearer ${spotifyAPI.getAccessToken()}`
            }
        }, async (err, response, body) => {
            if (err)
                reject(err);

            resolve(body);
        })
    });
};
const getPlaylistTracks = async (id)=>{
    return await new Promise((resolve,reject)=>{
       request.get({
           url:`https://api.spotify.com/v1/playlists/${id}/tracks`,
           headers:{
               'Authorization':`Bearer ${spotifyAPI.getAccessToken()}`
           }
       }, (err,response,body)=>{
          if(err)
              reject(err);

          resolve(JSON.parse(body));
       });
    });
};
const setToken = async (options) => {
    const tokens = await new Promise((resolve)=>{
        request.post(options, (err, res, body) => {
            resolve({
                access_token: body.access_token,
                refresh_token: body.refresh_token,
            });
        });
    });

    spotifyAPI.setAccessToken(tokens.access_token);
    spotifyAPI.setRefreshToken(tokens.refresh_token);

    return tokens;
};
const getProfile = async()=>{
    const profileReq  = {
        url : "https://api.spotify.com/v1/me",
        headers:{
            "content-type" : "application/json",
            "Authorization" : `Bearer ${spotifyAPI.getAccessToken()}`
        },
        json:true
    };
    return await new Promise((resolve,reject)=>{
        request.get(profileReq,(err,res,body)=>{
            if(err)
                reject(err);

            resolve({
                userID: body.id,
                displayName: body.display_name,
                country: body.country,
                email:body.email,
            })
        })
    });
};


module.exports.getPlaylistTracks = getPlaylistTracks;
module.exports.getProfile =getProfile;
module.exports.setToken = setToken;
module.exports.getPlaylists = getPlaylist;
module.exports.getAuthUrl =spotifyAPI.createAuthorizeURL(scope,state);
module.exports.redirectUrl =spotifyAPI.getRedirectURI();
module.exports.clientId = spotifyAPI.getClientId();
module.exports.clientSecret = spotifyAPI.getClientSecret();
module.exports.getToken = spotifyAPI.getAccessToken();