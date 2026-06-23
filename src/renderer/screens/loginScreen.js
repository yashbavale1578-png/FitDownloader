// Login Screen
class LoginScreen {
  constructor() {
    this.loginForm = document.getElementById('login-form');
    this.signupForm = document.getElementById('signup-form');
    this.errorEl = document.getElementById('auth-error');
    this.successEl = document.getElementById('auth-success');

    // Toggle forms
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showSignup();
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showLogin();
    });

    // Login button
    document.getElementById('btn-login')?.addEventListener('click', () => this.handleLogin());
    
    // Signup button
    document.getElementById('btn-signup')?.addEventListener('click', () => this.handleSignup());

    // Skip auth button
    document.getElementById('btn-skip-auth')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('auth:skip'));
    });

    // Enter key support
    document.getElementById('login-password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleLogin();
    });

    document.getElementById('signup-password')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSignup();
    });
  }

  showLogin() {
    this.loginForm.classList.add('active');
    this.signupForm.classList.remove('active');
    this.clearMessages();
  }

  showSignup() {
    this.loginForm.classList.remove('active');
    this.signupForm.classList.add('active');
    this.clearMessages();
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.textContent = 'LOGGING IN...';
    btn.disabled = true;

    const { user, error } = await supabase.signIn(email, password);

    btn.textContent = 'LOGIN';
    btn.disabled = false;

    if (error) {
      this.showError(error);
    } else {
      this.showSuccess('Welcome back!');
      await Utils.sleep(500);
      document.dispatchEvent(new CustomEvent('auth:success', { detail: user }));
    }
  }

  async handleSignup() {
    const username = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    const btn = document.getElementById('btn-signup');
    btn.textContent = 'CREATING...';
    btn.disabled = true;

    const { user, error } = await supabase.signUp(email, password, username);

    btn.textContent = 'CREATE ACCOUNT';
    btn.disabled = false;

    if (error) {
      this.showError(error);
    } else {
      this.showSuccess('Account created! Check your email to verify.');
      await Utils.sleep(1500);
      document.dispatchEvent(new CustomEvent('auth:success', { detail: user }));
    }
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.style.display = 'block';
    this.successEl.style.display = 'none';
    setTimeout(() => {
      this.errorEl.style.display = 'none';
    }, 5000);
  }

  showSuccess(message) {
    this.successEl.textContent = message;
    this.successEl.style.display = 'block';
    this.errorEl.style.display = 'none';
  }

  clearMessages() {
    this.errorEl.style.display = 'none';
    this.successEl.style.display = 'none';
  }
}
