$(document).ready(function () {
    $('nav').on('mouseenter', function () {
        fadeNavIn();
    }).on('mouseleave', function () {
        fadeNavOut();
    });

    $('#profile-link').on('mouseenter', function () {
        $('.side-dropdown').fadeIn(200);
    }).on('mouseleave', function () {
        $('.side-dropdown').on('mouseenter', function () {
            $('.side-dropdown').stop();
            $('.side-dropdown').fadeIn(300);
        }).on('mouseleave', function () {
            $('.side-dropdown').fadeOut(100);
        });
        $('.side-dropdown').fadeOut(1);
    });

    $('.nav-item').on('click', function () {
        $('.active').removeClass('active');
        $(this).addClass('active');
    });
    $('a').on('click', function (event) {
        event.preventDefault();
        const href = $(this).attr('href');
        window.history.pushState(null, null, href);
        $.ajax({
            url: href,
            success: function (data) {
                $('.wrapper').fadeOut(500, function () {
                    const newPage = $(data).find("div").filter('div .content-wrapper').html();
                    console.log(newPage);
                    $('.wrapper').html(newPage).fadeIn(500);
                });
            }
        });
    });
});


function fadeNavIn() {
    $('.nav-text').fadeIn(200);
}

function fadeNavOut() {
    $('.nav-text').fadeOut(200);
}

//Function that submits a post request to /uploadCover
function coverPicUpload() {
    $('#cover-picture').click();
    $('#cover-picture').on('change', function () {
        $('#cover-submit').click();
    })
}

//Function that submits a post request to /uploadProfile
function profilePicUpload() {
    $('#profile-picture').click();
    $('#profile-picture').on('change', function () {
        $('#profile-submit').click();
    })
}

function refine() {
    let genre = document.getElementById('genreSelect').value;
    let order = document.getElementById('orderBySelect').value;
    let pagination = document.getElementById('paginationSelect').value;

    $.ajax({
        url: `/discover?genre=${genre}&order=${order}&pagination=${pagination}`,
        success: function (data) {
            $('.songs-display').fadeOut(500, function () {
                const newPage = $(data).find("div").filter('div .songs-display').html();
                $('.songs-display').html(newPage).fadeIn(500);
            });
        }
    })
}