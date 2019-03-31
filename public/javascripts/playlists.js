$(document).ready(function () {
    let playlist_names = document.getElementsByClassName('playlist-name');
    let owner_names = document.getElementsByClassName('owner');

    $('.playlist-thumbnail').each(function (index) {
        $(this).on('click', function (event) {
            let playlist_name = $(playlist_names[index]).text();
            let owner = $(owner_names[index]).text();

            $.ajax({
                url: `/users/playlist/tracks?playlist_name=${playlist_name}&owner=${owner}`,
                success: function (data) {
                    const newPage = $(data).find('div').filter('div .playlist-tracks').html();
                    console.log(data);
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
});

