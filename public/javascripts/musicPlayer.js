//when the document has finished loading then do the follwoing
$(document).ready(function () {
    let current_track = 0;
    //get a reference for each of the players rendered
    //get a reference for each of the progress bars
    const progressBars = document.getElementsByClassName('progress');
    const progressBarsBackground = document.getElementsByClassName('progress-background');
    //get a reference for each of the songNames
    const names = document.getElementsByClassName('names');
    //get a reference for each of the play buttons
    const buttons = document.getElementsByClassName('play-button');
    //get a reference to the play button icons
    const plays = document.getElementsByClassName('play');
    const play_btn = document.getElementById("play");
    const forward_btn = document.getElementById("forwards");
    const backward_bnt = document.getElementById("backwards");
    //get a reference to the thumbnails
    const thumbnails = document.getElementsByClassName("thumbnailsUrl");
    //get a reference to the albums
    const albums = document.getElementsByClassName("albums");
    //get a reference to the artists
    const artists = document.getElementsByClassName("artists");
    //get a reference to the pause button icons
    const pauses = document.getElementsByClassName('pause');
    //get a reference to the views
    const views = document.getElementsByClassName('views');
    //get a reference to the likes
    const likes = document.getElementsByClassName('likes');
    //get a reference to the number of likes of each song
    const likes_count = document.getElementsByClassName('like_count');
    //get a reference to each of the audio elements
    const players = document.getElementsByClassName('audio-player');
    //get a reference to the current time of the song
    const currentTimes = document.getElementsByClassName('current-time');
    //get a reference to the duration of the song
    const endTimes = document.getElementsByClassName('end-time');
    //initialise an empty array of just played
    //this is going to be used so that views are accumulated only for one play per session
    let justPlayed = [];
    //set the array length to that of the number of players that have been rendered
    justPlayed.length = players.length;
    //variable that keeps track if any current tracks are playing
    let isPlaying = false;

    //set the value of the current tim
    $(currentTimes).each(function(index){
        $(this).text('0:00');
    });
    //set the value of the end time
    $(endTimes).each(function (index) {
        if(isNaN(players[index].duration)){
            $(this).text('0:00');
        }else{
            //calculates the end time and converts it into a string
            $(this).text(calculateTimeInMinutes(players[index].duration));
        }

    });

    //Add an event listener to each one of the play buttons
    $(buttons).each(function (index) {
        //for each button that is clicked
        $(this).on('click', function () {
            loadPlayer(index);
            //check if the song was just played
            //this is done so users dont spam the play button to gain views on their songs
            if(justPlayed[index] !== true) {
                //if the song was just played update the views.
                let v = (parseInt($(views[index]).text()) +1);
                let songName = $(names[index]).text().toString();
                //update the views count on the player
                $(views[index]).text(v.toString());
                //sent an ajax post request to update the views of a song on the database
                $.post('/updateView',{views:v,name:songName});
                //set the song as already played in this session
                justPlayed[index] = true;
            }

            //If music is playing and its not from this player then pause all of the other players
            if (isPlaying === true && players[index].paused === true) {
                //pause all players
                pauseAll(players,pauses,plays);
                //toggle the music player that was clicked
                isPlaying = togglePlay(players[index],pauses[index],plays[index]);
            } else
                //toggle the music player that was clicked
                isPlaying = togglePlay(players[index],pauses[index],plays[index]);

            $(players[index]).bind('timeupdate', function () {
                if(this.currentTime === this.duration)
                    this.currentTime =0;

                let songDuration = this.duration; //get the song duration
                let currentTime = this.currentTime; //get the elapsed time of the song

                $(currentTimes[index]).text(calculateTimeInMinutes(currentTime));
                $(endTimes[index]).text(calculateTimeInMinutes(songDuration));
                $(progressBars[index]).css('width',((currentTime / songDuration)*100)+"%");
            });
        });

        //Check for clicks on the progress bar of the song
        $(progressBarsBackground[index]).on('click',function (e) {
            //calculate the % offset of the beginning of the progress bar
            let percent = (e.pageX - this.offsetLeft)/this.offsetWidth; // or e.offsetX (less support, though)
            //Set the current time of the song to the (percent_offset * duration)
            players[index].currentTime = percent * players[index].duration;
            //update the css for the song
            $(progressBars[index]).css('width',(percent*100)+"%");
        })
    });

    //function that add like to a song or removes it
    //add an onclick listener to each like button that is rendered
    $(likes).each(function(index){
        //if a like button is clicked
        $(this).on('click',function(event){
            //get the name of the song using the index of the button clicked
            let songLiked = $(names[index]).text();
            let likes = $(likes_count[index]).text();
            //check if the like button has a class liked
            if($(this).hasClass('liked')){
                //if the button clicked has a class liked then make a query to unlike the song
                //pass in the name of the song whose button was clicked
                $.ajax({
                    url:`/users/unlike?song_name=${songLiked}&likes=${likes}`,
                    success:function (data) {
                        //upon success remove the class liked from the button
                        $(this).removeClass('liked');
                        $(this).css('color','white');
                    }//end success
                })//end ajax
            }else{
                //if the button clicked doesnt have a class liked then make a query to like the song
                //pass in the name of the song whose button was clicked
                $.ajax({
                    url:`/users/like?song_name=${songLiked}&likes=${likes}`,
                    success:function (data) {
                        //upon success add a class liked to the button
                        $(this).addClass('liked');
                        $(this).css('color','crimson');
                    }//end succes
                })//end ajax
            }//end else
        });//end event listener
    });//end $(likes).each();

    $('#close_player').on('click',function () {
        pauseAll(players);
        $('.player').fadeOut(300);
    });

    $(play_btn).on('click',function () {
        //else just toggle play for the player
        isPlaying = togglePlay(players[current_track]);
    });
    $(forward_btn).on('click',function(){
        pauseAll(players,pauses,plays);
        if(current_track + 1 > players.length-1 )
            loadPlayer(0);
        else
            loadPlayer(current_track+1);
        isPlaying = togglePlay(players[current_track]);
    });
    $(backward_bnt).on('click',function(){
        pauseAll(players,pauses,plays);
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
    
});//end $(document).ready();

//function that pauses all the audio players that are currently playing
function pauseAll(players,pauses,plays) {
    $(players).each(function (index) {
        if (players[index].paused === false) {
            $(pauses[index]).css('display','none');
            $(plays[index]).css('display','block');
            $('.play_icon').css("display","block");
            $('.pause_icon').css("display","none");
            players[index].pause();
            return false;
        }
    });
}

//toggles player on/off
function togglePlay(player,pause,play) {
    if (player.paused === false) {
        player.pause();
        $(play).css('display','block');
        $(pause).css('display','none');
        return false;
    } else {
        player.play();
        $('.play_icon').css("display","none");
        $('.pause_icon').css("display","block");
        $(play).css('display','none');
        $(pause).css('display','block');
        return true;
    }
}
//Return a formatted string of the time
function calculateTimeInMinutes(time) {
    let minutes = Math.floor(time / 60); //Get the time in minutes
    let secondsInt = time - minutes / 60; //get the seconds as an int
    let secondsStr = secondsInt.toString(); //convert the seconds into a string
    secondsStr = secondsStr.substr(0, 2); //Format the seconds to 2 numbers

    return minutes + ':' + secondsStr; //return a formatted string for the time in the form of MM:SS
}


function createMusicQueue(players){
    console.log(`Creating music queue`);
    console.log(players);
    window.localStorage['music_queue'] = players;
    console.log(`Music queue ${window.localStorage['music_queue']}`);
}