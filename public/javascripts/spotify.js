const playlists =document.getElementsByClassName('playlist_id');
$('.playlist-thumbnail').each(function (index) {
    $(this).on('click',function (event) {
        let playlist_id = $(playlists[index]).text();

        $.ajax({
            url: `/users/spotify/playlist/tracks?playlist_id=${playlist_id}`,
            success: function(data){
                const playlist_tracks = document.getElementById('playlist-tracks');
                $(playlist_tracks).html('');
                $(playlist_tracks).fadeIn(200);
                $(playlist_tracks).css("display","block");
                for(let item in data){
                    let track_div = document.createElement('div');
                    $(track_div).addClass("track");
                    track_div.innerHTML = `
                                <iframe src="https://open.spotify.com/embed/track/${data[item].track.id}" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
                                            `;
                    playlist_tracks.appendChild(track_div);
                }
            }
        })
    })
});