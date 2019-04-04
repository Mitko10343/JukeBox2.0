//when the document has finished loading then do the follwoing
$(document).ready(function () {
    //get a reference for each of the players rendered
    //get a reference for each of the progress bars
    const progressBars = document.getElementsByClassName('progress');
    const progressBarsBackground = document.getElementsByClassName('progress-background');
    //get a reference for each of the songNames
    const songNames = document.getElementsByClassName('songName');
    //get a reference for each of the play buttons
    const buttons = document.getElementsByClassName('play-button');
    //get a reference to the play button icons
    const plays = document.getElementsByClassName('play');
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

    //Add an event listener to each one of the play buttons
    $(buttons).each(function (index) {
        $(currentTimes[index]).text('0:00');
        $(endTimes[index]).text(calculateTimeInMinutes(players[index].duration));

        $(this).on('click', function () {
            if(justPlayed[index] !== true) {
                let v = (parseInt($(views[index]).text()) +1);
                let songName = $(songNames[index]).text().toString();
                $(views[index]).text(v.toString());
                $.post('/updateView',{views:v,name:songName});
                justPlayed[index] = true;
            }
            //If music is playing and its from this player that was toggled
            //then pause it
            if (isPlaying === true && players[index].paused === true) {
                pauseAll(players,pauses,plays);
                isPlaying = togglePlay(players[index],pauses[index],plays[index]);
            } else {
                isPlaying = togglePlay(players[index],pauses[index],plays[index]);
            }

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

        $(progressBarsBackground[index]).click(function (e) {
            let percent = (e.pageX - this.offsetLeft)/this.offsetWidth; // or e.offsetX (less support, though)
            console.log(e.pageX);
            console.log(this.offsetLeft);
            console.log(this.offsetWidth);
            players[index].currentTime = percent * players[index].duration;
            $(progressBars[index]).css('width',(percent*100)+"%");
        })
    });

    //function that add like to a song or removes it
    //add an onclick listener to each like button that is rendered
    $(likes).each(function(index){
        //if a like button is clicked
        $(this).on('click',function(event){
            //get the name of the song using the index of the button clicked
            let songLiked = $(songNames[index]).text();
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
    })//end $(likes).each();

});//end $(document).ready();

//function that pauses all the audio players that are currently playing
function pauseAll(players,pauses,plays) {
    $(players).each(function (index) {
        if (players[index].paused === false) {
            $(pauses[index]).css('display','none');
            $(plays[index]).css('display','block');
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
        $(play).css('display','none');
        $(pause).css('display','block');
        /*window.currentlyPlaying = player;
        console.log(window.currentlyPlaying);*/
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