//When ever the DOM is fully loaded the following functions are executed
$(document).ready(function () {
    //On hover over the navigation bar fade the text in and out
    $('nav').on('mouseenter', function () {
        fadeNavIn();
    }).on('mouseleave', function () {
        fadeNavOut();
    });

    //On hover over the profile navigation bar, fade in and out the extended drop down
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

    //On click of the navigation item then remove the active class from the last active nav link
    //and add it onto the new active nav link
    $('.nav-item').on('click', function () {
        $('.active').removeClass('active');
        $(this).addClass('active');
    });

    //On click of any of the navigation links
    $('a').on('click', function (event) {
        //prevent the default behaviour on navigation click
        //aka the flash re-direct of a page
        event.preventDefault();
        //get the href value of the anchor link that was clicked
        const href = $(this).attr('href');
        //manually push change the url of the page
        window.history.pushState(null, null, href);
        //ajax get request to the corresponding href
        $.ajax({
            url: href,
            success: function (data) {
                //upon success fully receiving data fade out the wrapper div
                $('.wrapper').fadeOut(500, function () {
                    //filter the data to extract only the content-wrapper div from the response
                    const newPage = $(data).find("div").filter('div .content-wrapper').html();
                    //attach the html of the filtered response to the wrapper div and fade it in again
                    $('.wrapper').html(newPage).fadeIn(500);
                });
            }//End of the success function
        });//end of the ajax call
    });
});

//Functions that fade the text on the navigation bar on hover
function fadeNavIn() {
    $('.nav-text').fadeIn(200);
}
function fadeNavOut() {
    $('.nav-text').fadeOut(200);
}

//Function that submits a post request to /uploadCover
function coverPicUpload() {
    $('#cover-picture').click().on('change', function () {
        $('#cover-submit').click();
    })
}

//Function that submits a post request to /uploadProfile
function profilePicUpload() {
    $('#profile-picture').click().on('change', function () {
        $('#profile-submit').click();
    })
}

//Function that refines the results of the discover page
function refine() {
    //Select the values from the each dropdown
    let genre = document.getElementById('genreSelect').value; //values for genre
    let order = document.getElementById('orderBySelect').value; //value for the order
    let pagination = document.getElementById('paginationSelect').value; //value for the pagination
    //Make an ajax request to get the refined results for the discover music page
    $.ajax({
        url: `/discover/music?genre=${genre}&order=${order}&pagination=${pagination}`,
        success: function (data) {
            //if successfull then fade out the song display div
            $('.songs-display').fadeOut(500, function () {
                //filter the data returned so you get only the html for the new results to be displayed
                const newPage = $(data).find("div").filter('div .songs-display').html();
                //attach the new results to the song-display div and fade it back in
                $('.songs-display').html(newPage).fadeIn(500);
            });
        }
    })
}