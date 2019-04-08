//when the document is ready
$(document).ready(function(){
    //declare a variable to keep track if a song is playing
    let isPlaying = false;
    let current_track = 0;

    //get a reference to all the songs
    const songs = document.getElementsByClassName("thumbnail");
    //get a reference to all of the audio players
    const players = document.getElementsByClassName("audio-player");
    const play = document.getElementById("play");
    const forward = document.getElementById("forwards");
    const backward = document.getElementById("backwards");
    //get a reference to the thumbnails
    const thumbnails = document.getElementsByClassName("thumbnailsUrl");
    //get a reference to the names
    const names = document.getElementsByClassName("names");
    //get a reference to the albums
    const albums = document.getElementsByClassName("albums");
    //get a reference to the artists
    const artists = document.getElementsByClassName("artists");
    //get a reference to the mp3_urls
    const mp3Urls = document.getElementsByClassName("mp3Urls");

    //for each song add an event listener
    $(songs).each(function (index) {
        //if a song thumbnail is clicked
        $(this).on("click",function (evt) {
            loadPlayer(index);
            //let progress = document.getElementById("player_progress");
            //check if a song is playing and if the current player is paused
            //if true for both pause all players and toggle play for the clicked song
            if (isPlaying === true && players[index].paused === true) {
                pauseAll(players);
                isPlaying = togglePlay(players[index]);
            } else {
                //else just toggle play for the player
                isPlaying = togglePlay(players[index]);
            }
        })
    });

    $('#close_player').on('click',function () {
        pauseAll(players);
        $('.player').fadeOut(300);
    });

    $(play).on('click',function () {
        //else just toggle play for the player
        isPlaying = togglePlay(players[current_track]);
    });
    $(forward).on('click',function(){
        isPlaying = togglePlay(players[current_track]);
        if(current_track + 1 > players.length-1 )
            loadPlayer(0);
        else
            loadPlayer(current_track+1);
        isPlaying = togglePlay(players[current_track]);
    });
    $(backward).on('click',function(){
        isPlaying = togglePlay(players[current_track]);
        if(current_track - 1 < 0 )
            loadPlayer(players.length-1);
        else
            loadPlayer(current_track-1);
        isPlaying = togglePlay(players[current_track]);
    });
    function loadPlayer(index){
        current_track = index;
        let thumbnail = document.createElement("img");
        thumbnail.setAttribute("src",$(thumbnails[index]).text());
        $(thumbnail).css("height","100%");
        $(thumbnail).css("width","100%");
        let name = document.createElement("span");
        name.innerHTML = `${$(names[index]).text()}`;
        let artist = document.createElement("span");
        artist.innerHTML = `${$(artists[index]).text()}`;
        let album= document.createElement("span");
        album.innerHTML = `${$(albums[index]).text()}`;

        $('.player').fadeIn(100);
        let player_name = document.getElementById("player_name");
        player_name.innerHTML='';
        player_name.appendChild(name);
        player_name.appendChild(artist);
        player_name.appendChild(album);
        let image = document.getElementById("player_thumbnail");
        image.innerHTML='';
        image.appendChild(thumbnail);
    }
});
//function that pauses all the audio players that are currently playing
function pauseAll(players) {
    $(players).each(function (index) {
        if (players[index].paused === false) {
            $('.play_icon').css("display","block");
            $('.pause_icone').css("display","none");
            players[index].pause();
            return false;
        }
    });
}

//toggles player on/off
function togglePlay(player) {
    if (player.paused === false) {
        $('.play_icon').css("display","block");
        $('.pause_icon').css("display","none");
        player.pause();
        return false;
    } else {
        $('.play_icon').css("display","none");
        $('.pause_icon').css("display","block");
        player.play();
        return true;
    }
}
