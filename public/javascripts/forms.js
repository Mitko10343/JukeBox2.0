$(document).ready(function () {
    /*
    * JQUERY FOR FORM SUBMISSION
    * */
    $('input').on('focus', function () {
        $(this).css("border", "none");
    });

    $('button').on('click',function () {
        $('.spinner').css('display','inline-block');
    });
    $('#login-button').on('click', function (event) {
        event.preventDefault();
        const username = $('#username-input').val();
        const password = $('#pwd-input').val();

        let validation = validateLogin(username, password);

        if (validation === 1) {
            event.preventDefault();
            $('.error-message').text("Please Fill out all fields").css("display", "block");
            $('#username-input').css("border", "2px solid red");
        } else if (validation === 2) {
            event.preventDefault();
            $('.error-message').text("Please Fill out all fields").css("display", "block");
            $('#pwd-input').css("border", "2px solid red");
        } else if (validation === 3) {
            event.preventDefault();
            $('.error-message').text("Username too short").css("display", "block");
            $('#username-input').css("border", "2px solid red");
        } else if (validation === 4) {
            event.preventDefault();
            $('.error-message').text("Password too short").css("display", "block");
            $('#pwd-input').css("border", "2px solid red");
        } else if (validation === 0) {
            $('.error-message').css("display", "none");
            $('#username-input').css("border", "none");
            $('#pwd-input').css("border", "none");
            $('#login-form').submit().on('error',function (error) {
                $('.error-message').text(error).css("display", "block");
            });
        }
    });

    $('#register-form').on('submit', function (event) {
        event.preventDefault();

        const username = $('#username-input').val();
        const email = $('#email-input').val();
        const pwd = $('#pwd-input').val();
        const cpwd = $('#pwd-confirm').val();
        const account = $('checkbox').is(':checked') ? 'artists' : 'users'; //if box is checked then true else false

        const validate = validateRegister(username, pwd, cpwd);

        if (validate === 0) {
            $('.error-message').text("Passwords not matching").css("display", "block");
            $('#pwd-input').css("border", "2px solid red");
            $('#pwd-confirm').css("border", "2px solid red");
        } else if (validate === 1) {
            $('.error-message').text("Username too short").css("display", "block");
            $('#username-input').css("border", "2px solid red");
        } else if (validate === 2) {
            $('.error-message').text("Password too short").css("display", "block");
            $('#pwd-input').css("border", "2px solid red");
        } else if (validate === 3) {
            console.log(account);
            $.post('/register', {
                username,
                email,
                pwd,
                account
            }, function (data) {
                $('.wrapper').fadeOut(500, function () {
                    $('#reg-button').innerHTML = `<i class="fa-li fa fa-spinner fa-spin"></i>`;
                    window.history.pushState(null, null, '/login');
                    const newPage = $(data).find("div").filter('div .content-wrapper').html();
                    $('.wrapper').html(newPage).fadeIn(500);
                });
            })
        }
    });
});

function validateRegister(uname, pwd, cpwd) {
    if (pwd !== cpwd) {
        return 0;
    } else if (uname.length < 6) {
        return 1;
    } else if (pwd.length < 6) {
        return 2;
    } else {
        return 3;
    }
}

function validateLogin(username, password) {
    if (username === '') {
        return 1;
    } else if (password === '') {
        return 2;
    } else if (username.length < 4) {
        return 3;
    } else if (password.length < 6) {
        return 4;
    } else {
        return 0;
    }
}