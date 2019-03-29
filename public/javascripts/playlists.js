const playlists = document.getElementsByClassName('playlist-name');
const owners = document.getElementsByClassName('owner');

$('.playlist-thumbnail').each(function (index) {
    $(this).on('click', function (event) {
        let playlist_name = $(playlists[index]).text();
        let owner = $(owners[index]).text();

        $.ajax({
            url: `/users/playlist/tracks?playlist_name=${playlist_name}&owner=${owner}`,
            success: function (data) {
                const newPage = $(data).find('div').filter('div .playlist-tracks').html();
                $('#playlist-tracks').html(newPage).fadeIn(200);
            }
        })
    })
});

$('#open_modal').on('click', function () {
    console.log("clicked");
    $('.playlist-create').fadeIn(500);
});
$('.close_button').on('click', function () {
    $('.modal').fadeOut(500);
});
