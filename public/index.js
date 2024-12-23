const SignUpForm = document.getElementById('signupForm');
const SignInForm = document.getElementById('signinForm');
const signinclick = document.getElementsByClassName('signinclick')[0];
const signupclick = document.getElementsByClassName('signupclick')[0];

signinclick.addEventListener('click', () => {
    SignUpForm.classList.add('form-hidden');
    SignInForm.classList.remove('form-hidden');
});

signupclick.addEventListener('click', () => {
    SignInForm.classList.add('form-hidden');
    SignUpForm.classList.remove('form-hidden');
});


SignUpForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email2').value;
    const password = document.getElementById('password2').value;

    const userData = { name, email, password };

    axios.post('http://localhost:3000/api/user/register', userData)
        .then(response => {
            const data = response.data;

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);

                alert(data.message);

                window.location.href = 'profile.html';
            } else {
                alert(data.error || 'Registration failed!');
            }
        })
        .catch(error => {
            console.error(error);
            alert('An unexpected error occurred. Please try again.');
        });
});

SignInForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const userData = { email, password };

    axios.post('http://localhost:3000/api/user/login', userData)
        .then(response => {
            const data = response.data;

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);

                alert(data.message);

                window.location.href = 'profile.html';
            } else {
                alert(data.error || 'Login failed!');
            }
        })
        .catch(error => {
            console.error(error);
            alert('An unexpected error occurred. Please try again.');
        });
});
