$(document).ready(function () {
    $('nav').on('mouseenter', function () {
        fadeNavIn();
    }).on('mouseleave', function () {
        fadeNavOut();
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