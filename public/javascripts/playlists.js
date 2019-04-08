//Once the DOM has finished rendering
$(document).ready(function () {
    //get the names of all of the playlists
    let playlist_names = document.getElementsByClassName('playlist-name');

    //For each playlist thumbnail
    $('.playlist-thumbnail').each(function (index) {
        //add an onclick listener
        $(this).on('click', function () {
            //If a playlist thumbnail is clicked, get that playlist's name
            let playlist_name = $(playlist_names[index]).text();

            //ajax get request that retrieves the tracks for a playlist
            //passing the playlist name through the query string of the URL
            $.ajax({
                url: `/users/playlist/tracks?playlist_name=${playlist_name}`,
                success: function (data) {
                    //on receiving a response, extract the playlist-tracks div from the html data reutned
                    const newPage = $(data).find('div').filter('div .playlist-tracks').html();
                    //Apply the tracks to the page and fade it in
                    $('#playlist-tracks').html(newPage).fadeIn(200);
                }//end success
            })//end ajax
        })//end on click listener
    });//end each

    //jQuery that opens a modal
    $('#open_modal').on('click', function () {
        $('.playlist-create').fadeIn(500);
    });//end jQuery

    //jQuery that closes a modal
    $('.close_button').on('click', function () {
        $('.modal').fadeOut(500);
    });//end jQuery

});//end $(document).ready();

