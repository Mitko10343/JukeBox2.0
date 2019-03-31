$(document).ready(function(){
    let playlists = document.getElementsByClassName('playlist-name');
    let owners = document.getElementsByClassName('owner');
    let shares = document.getElementsByClassName('shares');

    $('.playlist-thumbnail').each(function (index) {
        $(this).on('click', function (event) {
            let playlist_name = $(playlists[index]).text();
            let owner = $(owners[index]).text();
            let share = $(shares[index]).text();

            $.ajax({
                url: `/discover/playlist/tracks?playlist_name=${playlist_name}&owner=${owner}&shares=${share}`,
                success: function (data) {
                    const newPage = $(data).find('div').filter('div .playlist-tracks').html();
                    console.log(data);
                    $('#playlist-tracks').html(newPage).fadeIn(200);
                }
            })
        })
    });
    $('.add_playlist').each(function(index){
        $(this).on('click',function(){
            let playlist_name = $(playlists[index]).text();
            let owner = $(owners[index]).text();

            $.ajax({
                url:`/users/getPlaylist?playlist_name=${playlist_name}&owner=${owner}`,
                success:function(data){
                    console.log(data);
                }
            })
        });
    });

});



