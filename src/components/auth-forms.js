export class AuthForms {
    constructor(authService, scoreService) {
        this.authService = authService;
        this.scoreService = scoreService;
        this.initializeForms();
        this.setupAuthStateListener();
    }

    initializeForms() {
        this.registerForm = document.getElementById('register-form');
        this.loginForm = document.getElementById('login-form');
        this.logoutButton = document.getElementById('logout-button');
        this.loginButton = document.getElementById('login-button');
        this.userInfo = document.getElementById('user-info');
        this.userEmail = document.getElementById('user-email');
        this.scoreSection = document.getElementById('score-section');
        this.showRegisterLink = document.getElementById('show-register');
        this.showLoginLink = document.getElementById('show-login');
        this.loginFormContainer = document.getElementById('login-form-container');
        this.registerFormContainer = document.getElementById('register-form-container');
        this.landingPage = document.getElementById('landing-page');
        this.userDashboard = document.getElementById('user-dashboard');
        this.authSection = document.getElementById('auth-section');
        this.featuresSection = document.getElementById('features');
        this.aboutSection = document.getElementById('about');

        if (this.showRegisterLink && this.showLoginLink) {
            this.setupFormToggle();
        }

        this.setupEventListeners();
    }

    setupFormToggle() {
        if (this.showRegisterLink) {
            this.showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.loginFormContainer) this.loginFormContainer.classList.add('hidden');
                if (this.registerFormContainer) this.registerFormContainer.classList.remove('hidden');
            });
        }

        if (this.showLoginLink) {
            this.showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.registerFormContainer) this.registerFormContainer.classList.add('hidden');
                if (this.loginFormContainer) this.loginFormContainer.classList.remove('hidden');
            });
        }
    }

    setupEventListeners() {
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        if (this.logoutButton) {
            this.logoutButton.addEventListener('click', this.handleLogout.bind(this));
        }
        if (this.loginButton) {
            this.loginButton.addEventListener('click', () => {
                if (this.authSection) {
                    this.authSection.classList.remove('hidden');
                    if (this.loginFormContainer) {
                        this.loginFormContainer.classList.remove('hidden');
                    }
                    if (this.registerFormContainer) {
                        this.registerFormContainer.classList.add('hidden');
                    }
                }
            });
        }
    }

    setupAuthStateListener() {
        this.authService.onAuthStateChanged((user) => {
            if (user) {
                this.showUserInfo(user.email);
                this.hideLoginButton();
            } else {
                this.hideUserInfo();
                this.showLoginButton();
            }
        });
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = this.registerForm['register-email'].value;
        const password = this.registerForm['register-password'].value;

        try {
            await this.authService.register(email, password);
            this.registerForm.reset();
            alert('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            if (this.registerFormContainer) this.registerFormContainer.classList.add('hidden');
            if (this.loginFormContainer) this.loginFormContainer.classList.remove('hidden');
        } catch (error) {
            alert(error.message);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = this.loginForm['login-email'].value;
        const password = this.loginForm['login-password'].value;

        try {
            await this.authService.login(email, password);
            this.loginForm.reset();
            if (this.authSection) {
                this.authSection.classList.add('hidden');
            }
        } catch (error) {
            alert(error.message);
        }
    }

    async handleLogout() {
        try {
            await this.authService.logout();
        } catch (error) {
            alert(error.message);
        }
    }

    showUserInfo(email) {
        if (this.userInfo) this.userInfo.classList.remove('hidden');
        if (this.userEmail) this.userEmail.textContent = email;
        if (this.scoreSection) this.scoreSection.classList.remove('hidden');
        if (this.landingPage) this.landingPage.classList.add('hidden');
        if (this.userDashboard) this.userDashboard.classList.remove('hidden');
        if (this.authSection) this.authSection.classList.add('hidden');
        if (this.featuresSection) this.featuresSection.classList.add('hidden');
        if (this.aboutSection) this.aboutSection.classList.add('hidden');
    }

    hideUserInfo() {
        if (this.userInfo) this.userInfo.classList.add('hidden');
        if (this.scoreSection) this.scoreSection.classList.add('hidden');
        if (this.landingPage) this.landingPage.classList.remove('hidden');
        if (this.userDashboard) this.userDashboard.classList.add('hidden');
        if (this.authSection) this.authSection.classList.add('hidden');
        if (this.featuresSection) this.featuresSection.classList.remove('hidden');
        if (this.aboutSection) this.aboutSection.classList.remove('hidden');
    }

    hideLoginButton() {
        if (this.loginButton) this.loginButton.style.display = 'none';
    }

    showLoginButton() {
        if (this.loginButton) this.loginButton.style.display = 'block';
    }
}