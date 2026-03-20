(() => {
    const TOKEN_KEY = 'grandstay_admin_token';
    const LOGIN_ROUTE = '/admin';
    const DASHBOARD_ROUTE = '/admin/dashboard';

    const elements = {
        loginForm: document.getElementById('adminLoginForm'),
        loginButton: document.getElementById('adminLoginButton'),
        refreshButton: document.getElementById('adminRefreshButton'),
        logoutButton: document.getElementById('adminLogoutButton'),
        loginStatus: document.getElementById('adminLoginStatus'),
        sectionStatus: document.getElementById('adminSectionStatus'),
        dashboardPanel: document.getElementById('adminDashboardPanel'),
        sessionCard: document.getElementById('adminSessionCard'),
        sessionName: document.getElementById('adminSessionName'),
        sessionEmail: document.getElementById('adminSessionEmail'),
        emailInput: document.getElementById('adminEmail'),
        passwordInput: document.getElementById('adminPassword'),
        rememberCheckbox: document.getElementById('adminRemember'),
        roomBookingsTable: document.getElementById('adminRoomBookingsTable'),
        spaAppointmentsTable: document.getElementById('adminSpaAppointmentsTable'),
        foodOrdersTable: document.getElementById('adminFoodOrdersTable'),
        roomBookingsCount: document.getElementById('adminRoomBookingsCount'),
        foodOrdersCount: document.getElementById('adminFoodOrdersCount'),
        spaAppointmentsCount: document.getElementById('adminSpaAppointmentsCount'),
        revenuePipeline: document.getElementById('adminRevenuePipeline'),
        pendingMeta: document.getElementById('adminPendingMeta'),
        roomBookingsMeta: document.getElementById('adminRoomBookingsMeta'),
        foodOrdersMeta: document.getElementById('adminFoodOrdersMeta'),
        spaAppointmentsMeta: document.getElementById('adminSpaAppointmentsMeta'),
        roomBookingsChip: document.getElementById('adminRoomBookingsChip'),
        foodOrdersChip: document.getElementById('adminFoodOrdersChip'),
        spaAppointmentsChip: document.getElementById('adminSpaAppointmentsChip')
    };

    if (!elements.loginForm) {
        return;
    }

    const state = {
        token: '',
        user: null
    };

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

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function toDisplayDate(value) {
        if (!value) {
            return '';
        }

        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
            ? `${value}T00:00:00`
            : value;
        const date = new Date(normalized);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function toDisplayTime(value) {
        if (!value || value === 'asap') {
            return 'ASAP';
        }

        const [hours, minutes] = String(value).split(':').map(Number);
        const time = new Date();
        time.setHours(hours || 0, minutes || 0, 0, 0);

        return time.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDateTime(dateValue, timeValue = '') {
        const dateLabel = toDisplayDate(dateValue);
        const timeLabel = toDisplayTime(timeValue);
        return timeValue ? `${dateLabel} | ${timeLabel}` : dateLabel;
    }

    function getStatusClass(value) {
        return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
                : 'rgba(12, 22, 40, 0.96)';

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
            box-shadow: 0 20px 40px rgba(6, 10, 20, 0.28);
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

    async function fetchAdminJSON(url, options = {}) {
        if (!state.token) {
            throw new Error('Please sign in as an administrator.');
        }

        return fetchJSON(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${state.token}`
            }
        });
    }

    function createEmptyRow(colspan, message) {
        return `
            <tr>
                <td colspan="${colspan}" class="admin-empty-cell">${escapeHtml(message)}</td>
            </tr>
        `;
    }

    function updateHistory(pathname) {
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
        const nextPath = pathname.replace(/\/+$/, '') || '/';

        if (currentPath !== nextPath) {
            window.history.replaceState({}, '', nextPath);
        }
    }

    function applySessionDetails(user) {
        elements.sessionName.textContent = user?.name || 'GrandStay Admin';
        elements.sessionEmail.textContent = user?.email || '';
    }

    function setAuthenticatedUI(isAuthenticated) {
        document.body.classList.toggle('is-authenticated', isAuthenticated);
        elements.dashboardPanel.hidden = !isAuthenticated;
        elements.sessionCard.hidden = !isAuthenticated;
        elements.logoutButton.hidden = !isAuthenticated;
        elements.refreshButton.disabled = !isAuthenticated;
        elements.loginForm.hidden = isAuthenticated;
        updateHistory(isAuthenticated ? DASHBOARD_ROUTE : LOGIN_ROUTE);
    }

    function resetDashboard() {
        elements.roomBookingsCount.textContent = '0';
        elements.foodOrdersCount.textContent = '0';
        elements.spaAppointmentsCount.textContent = '0';
        elements.revenuePipeline.textContent = formatCurrency(0);
        elements.pendingMeta.textContent = 'No pending actions right now';
        elements.roomBookingsMeta.textContent = 'No reservations loaded yet';
        elements.foodOrdersMeta.textContent = 'No room-service orders loaded yet';
        elements.spaAppointmentsMeta.textContent = 'No spa appointments loaded yet';
        elements.roomBookingsChip.textContent = '0 active records';
        elements.foodOrdersChip.textContent = '0 active records';
        elements.spaAppointmentsChip.textContent = '0 active records';
        elements.roomBookingsTable.innerHTML = createEmptyRow(5, 'Sign in to view room bookings.');
        elements.spaAppointmentsTable.innerHTML = createEmptyRow(5, 'Sign in to view spa appointments.');
        elements.foodOrdersTable.innerHTML = createEmptyRow(5, 'Sign in to view food orders.');
        setStatus(elements.sectionStatus, '');
    }

    function clearStoredToken() {
        window.localStorage.removeItem(TOKEN_KEY);
        window.sessionStorage.removeItem(TOKEN_KEY);
    }

    function storeToken(token, remember = false) {
        clearStoredToken();
        const storage = remember ? window.localStorage : window.sessionStorage;
        storage.setItem(TOKEN_KEY, token);
    }

    function clearSession({ resetForm = true } = {}) {
        state.token = '';
        state.user = null;
        clearStoredToken();
        setAuthenticatedUI(false);
        resetDashboard();

        if (resetForm) {
            elements.loginForm.reset();
        }
    }

    function renderRoomBookings(bookings) {
        if (!Array.isArray(bookings) || bookings.length === 0) {
            elements.roomBookingsTable.innerHTML = createEmptyRow(5, 'No room bookings available yet.');
            return;
        }

        elements.roomBookingsTable.innerHTML = bookings.map((booking) => `
            <tr>
                <td>
                    <strong>${escapeHtml(booking.bookingId)}</strong>
                    <small>${escapeHtml(toDisplayDate(booking.createdAt))}</small>
                </td>
                <td>
                    <strong>${escapeHtml(booking.guestName)}</strong>
                    <small>${escapeHtml(booking.guestEmail)}</small>
                </td>
                <td>
                    <strong>${escapeHtml(toDisplayDate(booking.checkInDate))}</strong>
                    <small>to ${escapeHtml(toDisplayDate(booking.checkOutDate))}</small>
                </td>
                <td>
                    <span class="status-pill is-${escapeHtml(getStatusClass(booking.status))}">${escapeHtml(booking.status)}</span>
                    <small>${escapeHtml(booking.paymentStatus)}</small>
                </td>
                <td>
                    <strong>${escapeHtml(formatCurrency(booking.totalPrice))}</strong>
                    <small>${escapeHtml(booking.roomType)}</small>
                </td>
            </tr>
        `).join('');
    }

    function renderSpaAppointments(bookings) {
        if (!Array.isArray(bookings) || bookings.length === 0) {
            elements.spaAppointmentsTable.innerHTML = createEmptyRow(5, 'No spa appointments available yet.');
            return;
        }

        elements.spaAppointmentsTable.innerHTML = bookings.map((booking) => `
            <tr>
                <td>
                    <strong>${escapeHtml(booking.confirmationCode)}</strong>
                    <small>${escapeHtml(toDisplayDate(booking.createdAt))}</small>
                </td>
                <td>
                    <strong>${escapeHtml(booking.guestName)}</strong>
                    <small>${escapeHtml(booking.guestEmail)}</small>
                </td>
                <td>
                    <strong>${escapeHtml(booking.serviceName)}</strong>
                    <small>${escapeHtml(`${booking.duration} min`)}</small>
                </td>
                <td>
                    <strong>${escapeHtml(formatDateTime(booking.appointmentDate, booking.appointmentTime))}</strong>
                    <small>${escapeHtml(booking.therapistPreference || 'No preference')}</small>
                </td>
                <td>
                    <span class="status-pill is-${escapeHtml(getStatusClass(booking.status))}">${escapeHtml(booking.status)}</span>
                    <small>${escapeHtml(formatCurrency(booking.totalPrice))}</small>
                </td>
            </tr>
        `).join('');
    }

    function renderFoodOrders(orders) {
        if (!Array.isArray(orders) || orders.length === 0) {
            elements.foodOrdersTable.innerHTML = createEmptyRow(5, 'No food orders available yet.');
            return;
        }

        elements.foodOrdersTable.innerHTML = orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const preview = items.slice(0, 2).map((item) => `${item.quantity} x ${item.name}`).join(', ');
            const extraCount = Math.max(0, items.length - 2);
            const detailLine = extraCount > 0 ? `${preview} +${extraCount} more` : (preview || 'Order items');

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(order.orderId)}</strong>
                        <small>${escapeHtml(toDisplayDate(order.createdAt))}</small>
                    </td>
                    <td>
                        <strong>${escapeHtml(order.guestName)}</strong>
                        <small>${escapeHtml(order.guestEmail)}</small>
                    </td>
                    <td>
                        <strong>${escapeHtml(order.roomNumber)}</strong>
                        <small>${escapeHtml(order.estimatedDeliveryTime)}</small>
                    </td>
                    <td>
                        <strong>${escapeHtml(detailLine)}</strong>
                        <small>${escapeHtml(order.status)}</small>
                    </td>
                    <td>
                        <strong>${escapeHtml(formatCurrency(order.totalAmount))}</strong>
                        <small>${escapeHtml(`${items.length} item${items.length === 1 ? '' : 's'}`)}</small>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderSummary(bookings, spaBookings, foodOrders) {
        const pendingItems = [...bookings, ...spaBookings, ...foodOrders]
            .filter((item) => String(item.status || '').toLowerCase() === 'pending')
            .length;
        const revenuePipeline = bookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0)
            + spaBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0)
            + foodOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);

        elements.roomBookingsCount.textContent = String(bookings.length);
        elements.foodOrdersCount.textContent = String(foodOrders.length);
        elements.spaAppointmentsCount.textContent = String(spaBookings.length);
        elements.revenuePipeline.textContent = formatCurrency(revenuePipeline);
        elements.pendingMeta.textContent = `${pendingItems} pending item${pendingItems === 1 ? '' : 's'} requiring attention`;
        elements.roomBookingsMeta.textContent = bookings.length > 0
            ? `Latest reservation ${toDisplayDate(bookings[0].createdAt)}`
            : 'No reservations loaded yet';
        elements.foodOrdersMeta.textContent = foodOrders.length > 0
            ? `Latest order ${toDisplayDate(foodOrders[0].createdAt)}`
            : 'No room-service orders loaded yet';
        elements.spaAppointmentsMeta.textContent = spaBookings.length > 0
            ? `Next appointment ${toDisplayDate(spaBookings[0].appointmentDate)}`
            : 'No spa appointments loaded yet';
        elements.roomBookingsChip.textContent = `${bookings.length} active record${bookings.length === 1 ? '' : 's'}`;
        elements.foodOrdersChip.textContent = `${foodOrders.length} active record${foodOrders.length === 1 ? '' : 's'}`;
        elements.spaAppointmentsChip.textContent = `${spaBookings.length} active record${spaBookings.length === 1 ? '' : 's'}`;
    }

    async function loadDashboard() {
        setStatus(elements.sectionStatus, 'Loading live operational data...');
        elements.refreshButton.disabled = true;

        try {
            const [bookingsResponse, foodOrdersResponse, spaResponse] = await Promise.all([
                fetchAdminJSON('/api/bookings'),
                fetchAdminJSON('/api/food/admin/orders'),
                fetchAdminJSON('/api/spa/admin/bookings')
            ]);

            const bookings = bookingsResponse.bookings || [];
            const foodOrders = foodOrdersResponse.orders || [];
            const spaBookings = spaResponse.bookings || [];

            renderSummary(bookings, spaBookings, foodOrders);
            renderRoomBookings(bookings);
            renderSpaAppointments(spaBookings);
            renderFoodOrders(foodOrders);

            setStatus(
                elements.sectionStatus,
                `Dashboard refreshed at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`,
                'success'
            );
        } catch (error) {
            const message = error?.message || 'Unable to load the admin dashboard right now.';

            if (/authorization|token|admin/i.test(message)) {
                clearSession({ resetForm: false });
                setStatus(elements.loginStatus, 'Your admin session expired. Please sign in again.', 'error');
            }

            setStatus(elements.sectionStatus, message, 'error');
        } finally {
            elements.refreshButton.disabled = !state.token;
        }
    }

    async function restoreSession() {
        const storedToken = window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY) || '';

        resetDashboard();
        setAuthenticatedUI(false);

        if (!storedToken) {
            return;
        }

        state.token = storedToken;

        try {
            const result = await fetchAdminJSON('/api/auth/me');

            if (result.user?.role !== 'admin') {
                throw new Error('This account does not have administrator access.');
            }

            state.user = result.user;
            applySessionDetails(result.user);
            setAuthenticatedUI(true);
            await loadDashboard();
        } catch (_error) {
            clearSession({ resetForm: false });
        }
    }

    async function handleLogin(event) {
        event.preventDefault();

        const email = elements.emailInput.value.trim();
        const password = elements.passwordInput.value;

        if (!email || !password) {
            setStatus(elements.loginStatus, 'Enter your administrator email and password.', 'error');
            return;
        }

        elements.loginButton.disabled = true;
        setStatus(elements.loginStatus, 'Signing you into the admin console...');

        try {
            const result = await fetchJSON('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (result.user?.role !== 'admin') {
                throw new Error('This account does not have administrator access.');
            }

            state.token = result.token;
            state.user = result.user;
            storeToken(result.token, Boolean(elements.rememberCheckbox?.checked));
            applySessionDetails(result.user);
            setAuthenticatedUI(true);
            setStatus(elements.loginStatus, 'Administrator access granted.', 'success');
            await loadDashboard();
            elements.dashboardPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Admin dashboard unlocked.', 'success');
        } catch (error) {
            state.token = '';
            state.user = null;
            clearStoredToken();
            setAuthenticatedUI(false);
            setStatus(elements.loginStatus, error?.message || 'Unable to sign in right now.', 'error');
            showToast('Admin sign-in failed.', 'error');
        } finally {
            elements.loginButton.disabled = false;
        }
    }

    function handleLogout() {
        clearSession();
        setStatus(elements.loginStatus, 'You have been signed out.', 'success');
        showToast('Admin session closed.');
    }

    function init() {
        resetDashboard();
        setAuthenticatedUI(false);
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.refreshButton.addEventListener('click', loadDashboard);
        elements.logoutButton.addEventListener('click', handleLogout);
        restoreSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
