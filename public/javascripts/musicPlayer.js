$(document).ready(function () {

    //const playButtons = document.getElementsById('#play-button');
    //console.log(playButtons);
    const progressBars = document.getElementsByClassName('progress');
    const progressBarsBackground = document.getElementsByClassName('progress-background');
    const songNames = document.getElementsByClassName('songName');
    const buttons = document.getElementsByClassName('play-button');
    const plays = document.getElementsByClassName('play');
    const pauses = document.getElementsByClassName('pause');
    const views = document.getElementsByClassName('views');
    const likes = document.getElementsByClassName('likes');
    const players = document.getElementsByClassName('audio-player');
    const currentTimes = document.getElementsByClassName('current-time');
    const endTimes = document.getElementsByClassName('end-time');
    let justPlayed = [];
    justPlayed.length = players.length;
    let isPlaying = false;

/*
    console.log(`Music queue ${window.musicQueue}`);
    if(players.length >0 && typeof window.musicQueue === 'undefined'){
        console.log("Starting");
        createMusicQueue(players);
    }else{
        console.log("Starting 222");
        console.log(`Exists ${window.musicQueue}`);
        console.log(`currently playing ${window.currentlyPlaying}`);
    }*/


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
});

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
    window.musicQueue = players;
    console.log(`Music queue ${window.musicQueue}`);
}