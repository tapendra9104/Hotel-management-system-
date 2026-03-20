(() => {
    const USER_TOKEN_KEY = 'grandstay_user_token';
    const ADMIN_TOKEN_KEY = 'grandstay_admin_token';

    const elements = {
        tabButtons: Array.from(document.querySelectorAll('[data-auth-tab]')),
        loginPanel: document.getElementById('authPanelLogin'),
        registerPanel: document.getElementById('authPanelRegister'),
        loginForm: document.getElementById('memberLoginForm'),
        registerForm: document.getElementById('memberRegisterForm'),
        loginStatus: document.getElementById('memberLoginStatus'),
        registerStatus: document.getElementById('memberRegisterStatus'),
        loginButton: document.getElementById('memberLoginButton'),
        registerButton: document.getElementById('memberRegisterButton'),
        loginEmail: document.getElementById('memberLoginEmail'),
        loginPassword: document.getElementById('memberLoginPassword'),
        registerName: document.getElementById('memberRegisterName'),
        registerEmail: document.getElementById('memberRegisterEmail'),
        registerPhone: document.getElementById('memberRegisterPhone'),
        registerPassword: document.getElementById('memberRegisterPassword'),
        rememberCheckbox: document.getElementById('memberRemember'),
        sessionCard: document.getElementById('memberSessionCard'),
        sessionName: document.getElementById('memberSessionName'),
        sessionEmail: document.getElementById('memberSessionEmail'),
        sessionCopy: document.getElementById('memberSessionCopy'),
        logoutButton: document.getElementById('memberLogoutButton')
    };

    if (!elements.loginForm || !elements.registerForm) {
        return;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => {
            const replacements = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };

            return replacements[character] || character;
        });
    }

    function setStatus(element, message = '', tone = '') {
        if (!element) {
            return;
        }

        element.textContent = message;
        element.classList.remove('is-error', 'is-success');

        if (tone) {
            element.classList.add(`is-${tone}`);
        }
    }

    function showToast(message, tone = 'neutral') {
        const toast = document.createElement('div');
        const background = tone === 'success'
            ? 'rgba(29, 122, 69, 0.96)'
            : tone === 'error'
                ? 'rgba(179, 58, 58, 0.96)'
                : 'rgba(23, 50, 79, 0.96)';

        toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 9999;
            max-width: min(92vw, 360px);
            padding: 0.95rem 1rem;
            border-radius: 18px;
            background: ${background};
            color: #ffffff;
            box-shadow: 0 20px 40px rgba(24, 41, 63, 0.2);
            font-weight: 600;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        window.setTimeout(() => toast.remove(), 3200);
    }

    async function fetchJSON(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    }

    function readStoredToken() {
        return window.localStorage.getItem(USER_TOKEN_KEY) || window.sessionStorage.getItem(USER_TOKEN_KEY) || '';
    }

    function clearStoredTokens() {
        window.localStorage.removeItem(USER_TOKEN_KEY);
        window.sessionStorage.removeItem(USER_TOKEN_KEY);
    }

    function storeUserToken(token, remember) {
        clearStoredTokens();
        const storage = remember ? window.localStorage : window.sessionStorage;
        storage.setItem(USER_TOKEN_KEY, token);
    }

    function setActiveTab(tabName) {
        const isLogin = tabName === 'login';
        elements.tabButtons.forEach((button) => {
            const isActive = button.dataset.authTab === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        elements.loginPanel.hidden = !isLogin;
        elements.registerPanel.hidden = isLogin;
    }

    function applySession(user) {
        elements.sessionName.textContent = user?.name || 'GrandStay Member';
        elements.sessionEmail.textContent = user?.email || '';
        elements.sessionCopy.innerHTML = `Welcome back, <strong>${escapeHtml(user?.name || 'Guest')}</strong>. Your GrandStay member session is active and ready for rooms, spa services, and dining.`;
        elements.sessionCard.hidden = false;
        elements.loginPanel.hidden = true;
        elements.registerPanel.hidden = true;
        document.querySelector('.portal-tabs')?.setAttribute('hidden', 'hidden');
    }

    function clearSessionUI() {
        elements.sessionCard.hidden = true;
        document.querySelector('.portal-tabs')?.removeAttribute('hidden');
        setActiveTab('login');
    }

    async function fetchCurrentUser(token) {
        return fetchJSON('/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    async function restoreSession() {
        clearSessionUI();
        setStatus(elements.loginStatus, '');
        setStatus(elements.registerStatus, '');

        const token = readStoredToken();
        if (!token) {
            return;
        }

        try {
            const result = await fetchCurrentUser(token);

            if (result.user?.role === 'admin') {
                clearStoredTokens();
                window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
                window.location.replace('/admin/dashboard');
                return;
            }

            applySession(result.user);
        } catch (_error) {
            clearStoredTokens();
        }
    }

    async function handleLogin(event) {
        event.preventDefault();

        const payload = {
            email: elements.loginEmail.value.trim(),
            password: elements.loginPassword.value
        };

        if (!payload.email || !payload.password) {
            setStatus(elements.loginStatus, 'Enter your email address and password.', 'error');
            return;
        }

        elements.loginButton.disabled = true;
        setStatus(elements.loginStatus, 'Signing you into your GrandStay account...');

        try {
            const result = await fetchJSON('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (result.user?.role === 'admin') {
                clearStoredTokens();
                window.sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
                window.location.replace('/admin/dashboard');
                return;
            }

            storeUserToken(result.token, Boolean(elements.rememberCheckbox.checked));
            applySession(result.user);
            setStatus(elements.loginStatus, 'Login successful.', 'success');
            showToast('Guest account unlocked.', 'success');
        } catch (error) {
            setStatus(elements.loginStatus, error?.message || 'Unable to sign in right now.', 'error');
            showToast('Guest sign-in failed.', 'error');
        } finally {
            elements.loginButton.disabled = false;
        }
    }

    async function handleRegister(event) {
        event.preventDefault();

        const payload = {
            name: elements.registerName.value.trim(),
            email: elements.registerEmail.value.trim(),
            phone: elements.registerPhone.value.trim(),
            password: elements.registerPassword.value
        };

        if (!payload.name || !payload.email || !payload.password) {
            setStatus(elements.registerStatus, 'Name, email, and password are required.', 'error');
            return;
        }

        elements.registerButton.disabled = true;
        setStatus(elements.registerStatus, 'Creating your GrandStay member profile...');

        try {
            const result = await fetchJSON('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            storeUserToken(result.token, true);
            applySession(result.user);
            setStatus(elements.registerStatus, 'Account created successfully.', 'success');
            showToast('Member profile created.', 'success');
        } catch (error) {
            setStatus(elements.registerStatus, error?.message || 'Unable to create your account right now.', 'error');
            showToast('Member registration failed.', 'error');
        } finally {
            elements.registerButton.disabled = false;
        }
    }

    function handleLogout() {
        clearStoredTokens();
        elements.loginForm.reset();
        elements.registerForm.reset();
        clearSessionUI();
        setStatus(elements.loginStatus, 'You have been signed out.', 'success');
        showToast('Guest session closed.');
    }

    function init() {
        elements.tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setStatus(elements.loginStatus, '');
                setStatus(elements.registerStatus, '');
                setActiveTab(button.dataset.authTab || 'login');
            });
        });

        elements.loginForm.addEventListener('submit', handleLogin);
        elements.registerForm.addEventListener('submit', handleRegister);
        elements.logoutButton.addEventListener('click', handleLogout);
        restoreSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
