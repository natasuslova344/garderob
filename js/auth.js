const Auth = (() => {
  const switchTab = (tab) => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`form-${tab}`).classList.remove('hidden');
  };

  const validateLoginForm = () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('login-email', 'Введите корректный email');
      valid = false;
    } else {
      clearFieldError('login-email');
    }

    if (password.length < 4) {
      setFieldError('login-password', 'Пароль должен содержать минимум 4 символа');
      valid = false;
    } else {
      clearFieldError('login-password');
    }

    return valid;
  };

  const validateRegisterForm = () => {
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('reg-email', 'Введите корректный email');
      valid = false;
    } else {
      clearFieldError('reg-email');
    }

    if (password.length < 6) {
      setFieldError('reg-password', 'Пароль должен содержать минимум 6 символов');
      valid = false;
    } else if (password.length > 50) {
      setFieldError('reg-password', 'Пароль слишком длинный');
      valid = false;
    } else {
      clearFieldError('reg-password');
    }

    if (password !== confirm) {
      setFieldError('reg-confirm', 'Пароли не совпадают');
      valid = false;
    } else {
      clearFieldError('reg-confirm');
    }

    return valid;
  };

  const setFieldError = (id, msg) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}-error`);
    if (input) input.classList.add('error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
  };

  const clearFieldError = (id) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(`${id}-error`);
    if (input) input.classList.remove('error');
    if (errEl) errEl.classList.remove('visible');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'Входим...';

    try {
      const user = Store.loginUser(email, password);
      Store.setSession(user);
      AppState.setUser(user);
      UI.showApp();
    } catch (err) {
      setFieldError('login-password', err.message);
      btn.disabled = false;
      btn.textContent = 'Войти';
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('btn-register');
    btn.disabled = true;
    btn.textContent = 'Создаём...';

    try {
      const user = Store.registerUser(email, password);
      Store.setSession(user);
      AppState.setUser(user);
      UI.showApp();
      Toast.show('Добро пожаловать! Ваш гардероб создан 🎉', 'success', 4000);
    } catch (err) {
      setFieldError('reg-email', err.message);
      btn.disabled = false;
      btn.textContent = 'Создать аккаунт';
    }
  };

  const setupBlurValidation = () => {
    ['login-email', 'login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('blur', () => {
        validateLoginForm();
      });
    });
    ['reg-email', 'reg-password', 'reg-confirm'].forEach(id => {
      document.getElementById(id)?.addEventListener('blur', () => {
        validateRegisterForm();
      });
    });
  };

  const init = () => {
    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));
    document.getElementById('form-login')?.addEventListener('submit', handleLogin);
    document.getElementById('form-register')?.addEventListener('submit', handleRegister);
    setupBlurValidation();
  };

  return { init, switchTab };
})();
