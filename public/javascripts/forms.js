//This javascript file handles all of the form validation before a form is submitted

//When a document is ready execute the following functions
$(document).ready(function () {
    //If an input field is focused remove any outlines
    $('input').on('focus', function () {
        $(this).css("outline", "none");
    });

    //When ever a button is clicked then render a loading spinner
    $('button').on('click', function () {
        $('.spinner').css('display', 'inline-block');
    });

    //A trigger function that is triggered when the login form is submitted
    $('#login-button').on('click', function (event) {
        //prevent the default event behaviour the button is clicked
        event.preventDefault();
        //get the values for the username and password input fields
        const username = $('#username-input').val();
        const password = $('#pwd-input').val();

        //validate the inputs using the validateLogin function
        //the validateLogin returns an integer code
        let validation = validateLogin(username, password);

        //From the corresponding code returned from the validateLogin function
        //render an error message and highlight which field the error is in
        if (validation === 1) {
            $('.error-message').text("Please Fill out all fields").css("display", "block");
            $('#username-input').css("outline", "2px solid red");
            $('.fa-spinner').css("display", "none");
        } else if (validation === 2) {
            $('.error-message').text("Please Fill out all fields").css("display", "block");
            $('#pwd-input').css("outline", "2px solid red");
            $('.fa-spinner').css("display", "none");
        } else if (validation === 3) {
            $('.error-message').text("Username too short").css("display", "block");
            $('#username-input').css("outline", "2px solid red");
            $('.fa-spinner').css("display", "none");
        } else if (validation === 4) {
            $('.error-message').text("Password too short").css("display", "block");
            $('#pwd-input').css("outline", "2px solid red");
            $('.fa-spinner').css("display", "none");
        } else if (validation === 0) {
            //if an error code of 0 is returned then remove all error messages and outlines
            $('.error-message').css("display", "none");
            $('#username-input').css("outline", "none");
            $('#pwd-input').css("border", "none");
            //submit the form
           $('#login-form').submit().on('error', function (error) {
                   $('.error-message').text(error).css("display", "block");
            });
/*
            $.ajax({
                url:'/login',
                method:'post',
                data:{
                    username,
                    password
                },
                success:function (data) {
                    console.log(data);
                },
                error:function (error) {
                    $('.error-message').text(error.message).css("display", "block");
                }
            })*/
        }
    });//end login-form trigger

    //A trigger function that is triggered whn the register form is submitted
    $('#register-form').on('submit', function (event) {
        //preven the default behaviour of the form
        event.preventDefault();

        //get the values for the username,email,password,confirm_password and account_type fields
        const username = $('#username-input').val();
        const email = $('#email-input').val();
        const pwd = $('#pwd-input').val();
        const cpwd = $('#pwd-confirm').val();
        const account = $('#artist_account').is(':checked') ? 'artists' : 'users'; //if box is checked then true else false

        //validate the register form input
        //the function returns a code
        const validate = validateRegister(username, pwd, cpwd);

        //render the corresponding error message and highlight the input fields where the error occured
        //based on the error code returned
        if (validate === 1) {
            $('.error-message').text("Username too short").css("display", "block");
            $('#username-input').css("outline", "2px solid red");
            $('.fa-spinner').css('display', 'none');
        } else if (validate === 2) {
            $('.error-message').text("Password too short").css("display", "block");
            $('#pwd-input').css("outline", "2px solid red");
            $('.fa-spinner').css('display', 'none');
        } else if (validate === 3) {
            $('.error-message').text("Passwords not matching").css("display", "block");
            $('#pwd-input').css("outline", "2px solid red");
            $('#pwd-confirm').css("outline", "2px solid red");
            $('.fa-spinner').css('display', 'none');
        } else if (validate === 0) {
            //if the register form is validated then submit the form
            $.post('/register', {
                username,
                email,
                pwd,
                account
            }, function (data) {
                //upon success then render the login page
                //fade out the rapper div
                $('.wrapper').fadeOut(500, function () {
                    //add a spinner to the register button
                    $('#reg-button').innerHTML = `<i class="fa-li fa fa-spinner fa-spin"></i>`;
                    //manually change the url to the /login url
                    window.history.pushState(null, null, '/login');
                    //filter the data returned to get just the html for the login form
                    const newPage = $(data).find("div").filter('div .content-wrapper').html();
                    //attach the html for the login form to the wrapper div and fade it back in
                    $('.wrapper').html(newPage).fadeIn(500);
                });//end fade
            })//end post
        }//end else
    });//end function

    $('#uploadSong').on('click', function (event) {
        event.preventDefault();
        const song = $('#song').val();
        const thumbnail = $('#thumbnail').val();

        if (typeof song === "undefined" || song === '') {
            $('#songPath').css('border', '2px solid red');
            $('.error-message').text("Select a song to upload").css("display", "block");
        } else if (typeof thumbnail === "undefined" || thumbnail === '') {
            $('#imgPath').css('border', '2px solid red');
            $('.error-message').text("Select a thumbnail for the sing").css("display", "block");
        } else if ($('#agree').is(":not(:checked)")) {
            $('.error-message').text("You must agree to our rules").css("display", "block");
            $('#agree').css('outline', '2px solid red');
        } else {
            $('#upload-form').submit();
        }
    });
});

//if one of the these two functions is triggered then click the hidden file upload field
function songUpload() {
    document.getElementById('song').click();
}
function thumbnailUpload() {
    document.getElementById('thumbnail').click();
}

/**
 * Function that validates the register form
 * @param username
 * @param password
 * @param confirm_password
 * @returns {number}
 */
function validateRegister(username, password, confirm_password) {
    //if the username is too short then return error code 1
    if (username.length < 6)
        return 1;
    //if password is too short return an error code 2
    else if (password.length < 6)
        return 2;
    //if the password doesn't equal confirm password then return an error code 0
    else if (password !== confirm_password)
        return 3;
    //if everything is ok then return error code 3
    else
        return 0;


}

/**
 * Function that validates the login form
 * @param username
 * @param password
 * @returns {number}
 */
function validateLogin(username, password) {
    //if username field is empty return code 1
    if (username === '')
        return 1;
    //if password field is empty return error code 2
    else if (password === '')
        return 2;
    //if the username is too short return an error
    else if (username.length < 6)
        return 3;
    //if the password is too short return an error
    else if (password.length < 6)
        return 4;
    //if everything is ok then return 0
    else
        return 0;
}//end validate login function

