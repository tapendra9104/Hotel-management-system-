(() => {
    const app = window.GrandStayApp;
    if (!app) {
        return;
    }

    const bookingModal = document.getElementById('roomBookingModal');
    const roomBookingForm = document.getElementById('roomBookingForm');
    const bookingSubmitButton = document.getElementById('bookingSubmitButton');
    const bookingStatus = document.getElementById('bookingModalStatus');

    const spaBookingModal = document.getElementById('spaBookingModal');
    const spaBookingForm = document.getElementById('spaBookingForm');
    const spaSubmitButton = document.getElementById('spaBookingSubmitButton');
    const spaStatus = document.getElementById('spaBookingStatus');

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

    function getRoomImageFallback(roomName) {
        const keyMap = {
            'Standard Room': 'rooms.standard',
            'Deluxe Room': 'rooms.deluxe',
            'Suite': 'rooms.suite'
        };

        return app.getImageConfigByPath(keyMap[roomName])?.url || '';
    }

    function renderRooms(rooms) {
        const grid = document.getElementById('roomsGrid');
        if (!grid) {
            return;
        }

        grid.innerHTML = rooms.map((room) => {
            const badgeClass = !room.isAvailable ? 'is-soldout' : room.availableRooms <= 1 ? 'is-limited' : 'is-available';
            const amenities = (room.amenities || []).slice(0, 4)
                .map((amenity) => `<span class="amenity-chip">${app.escapeHtml(amenity)}</span>`)
                .join('');

            return `
                <article class="room-card">
                    <img src="${app.escapeHtml(room.image || getRoomImageFallback(room.name))}" alt="${app.escapeHtml(room.name)}" loading="lazy">
                    <div class="room-info">
                        <div class="room-card-header">
                            <div>
                                <h4>${app.escapeHtml(room.name)}</h4>
                                <p>${app.escapeHtml(room.description)}</p>
                            </div>
                            <span class="availability-badge ${badgeClass}">${app.escapeHtml(room.availabilityMessage)}</span>
                        </div>
                        <div class="amenity-list">${amenities}</div>
                        <div class="room-actions">
                            <div class="room-meta">
                                <div class="room-price">${app.escapeHtml(app.formatCurrency(room.price))}<span>/night</span></div>
                                <div class="room-capacity">Sleeps up to ${app.escapeHtml(room.capacity)}</div>
                            </div>
                            <button
                                type="button"
                                class="btn btn-outline room-book-btn"
                                data-room-name="${app.escapeHtml(room.name)}"
                                data-room-price="${app.escapeHtml(room.price)}"
                                data-room-description="${app.escapeHtml(room.description)}"
                                ${room.isAvailable ? '' : 'disabled'}
                            >${room.isAvailable ? 'Book This Room' : 'Sold Out'}</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        app.observeCards(grid);
    }

    function updateRoomsSummary(search, rooms) {
        const summary = document.getElementById('roomsSearchSummary');
        const meta = document.getElementById('roomsSearchMeta');
        if (!summary || !meta) {
            return;
        }

        const availableCount = rooms.filter((room) => room.isAvailable).length;
        summary.textContent = `${availableCount} room type${availableCount === 1 ? '' : 's'} available from ${app.formatLongDate(search.checkIn)} to ${app.formatLongDate(search.checkOut)}`;
        meta.textContent = 'Inventory updates instantly when reservations are created, so you always see the latest availability.';
    }

    app.loadRoomInventory = async (search = app.getStaySearchCriteria(), options = {}) => {
        const query = new URLSearchParams(search);
        app.setSectionFeedback('roomsSectionStatus', 'Checking live room availability...');

        try {
            const data = await app.fetchJSON(`/api/rooms?${query.toString()}`);
            app.state.roomInventory = data.rooms || [];
            app.state.roomSearch = { ...search };
            renderRooms(app.state.roomInventory);
            updateRoomsSummary(search, app.state.roomInventory);

            app.setSectionFeedback(
                'roomsSectionStatus',
                'Live availability is up to date.',
                'success'
            );

            if (options.showToast) {
                app.createFloatingMessage(`Showing room availability from ${app.formatLongDate(search.checkIn)} to ${app.formatLongDate(search.checkOut)}.`, {
                    background: '#1d7a45',
                    color: '#ffffff'
                });
            }
        } catch (error) {
            app.setSectionFeedback('roomsSectionStatus', error.message || 'Unable to load room inventory right now.', 'error');
        }
    };

    function openRoomBooking(button) {
        const staySearch = app.getStaySearchCriteria();
        document.getElementById('bookingRoomType').value = button.dataset.roomName;
        document.getElementById('bookingRoomName').textContent = button.dataset.roomName;
        document.getElementById('bookingRoomDescription').textContent = button.dataset.roomDescription;
        document.getElementById('bookingRoomPrice').textContent = app.formatCurrency(button.dataset.roomPrice);
        document.getElementById('bookingCheckInDate').value = staySearch.checkIn;
        document.getElementById('bookingCheckOutDate').value = staySearch.checkOut;
        document.getElementById('bookingNumberOfGuests').value = document.getElementById('guests')?.value || '2';
        document.getElementById('bookingNumberOfRooms').value = '1';
        setStatus(bookingStatus, '');
        app.openModal(bookingModal);
    }

    async function submitRoomBooking(event) {
        event.preventDefault();

        const payload = {
            guestName: document.getElementById('bookingGuestName').value.trim(),
            guestEmail: document.getElementById('bookingGuestEmail').value.trim(),
            guestPhone: document.getElementById('bookingGuestPhone').value.trim(),
            roomType: document.getElementById('bookingRoomType').value,
            checkInDate: document.getElementById('bookingCheckInDate').value,
            checkOutDate: document.getElementById('bookingCheckOutDate').value,
            numberOfGuests: Number(document.getElementById('bookingNumberOfGuests').value),
            numberOfRooms: Number(document.getElementById('bookingNumberOfRooms').value),
            specialRequests: document.getElementById('bookingSpecialRequests').value.trim()
        };

        if (new Date(payload.checkOutDate) <= new Date(payload.checkInDate)) {
            setStatus(bookingStatus, 'Check-out date must be after check-in date.', 'error');
            return;
        }

        try {
            setStatus(bookingStatus, 'Submitting your reservation...');
            bookingSubmitButton.disabled = true;
            const result = await app.fetchJSON('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const message = `Booking confirmed. Reference: ${result.booking.bookingId}`;

            setStatus(bookingStatus, message, 'success');
            roomBookingForm.reset();
            app.createFloatingMessage(message, { background: '#1d7a45', color: '#ffffff' });
            await app.loadRoomInventory(app.state.roomSearch.checkIn ? app.state.roomSearch : app.getStaySearchCriteria());
            setTimeout(() => app.closeModal(bookingModal), 1400);
        } catch (error) {
            setStatus(bookingStatus, error.message || 'Unable to complete booking right now.', 'error');
        } finally {
            bookingSubmitButton.disabled = false;
        }
    }

    function renderSpaServices(services) {
        const grid = document.getElementById('spaServicesGrid');
        if (!grid) {
            return;
        }

        const nextAvailable = app.state.spaAvailability?.nextAvailable?.label || 'Check live slots';
        grid.innerHTML = services.map((service) => {
            const serviceTypeLabel = service.serviceType.replace(/-/g, ' ');
            const image = service.image || app.getImageConfigByPath('facilities.spa')?.url || '';
            const imageAlt = service.imageAlt || `${service.name} at GrandStay Spa`;

            return `
            <article class="spa-card">
                <div class="experience-card-media-wrap">
                    <img class="experience-card-media" src="${app.escapeHtml(image)}" alt="${app.escapeHtml(imageAlt)}" loading="lazy">
                </div>
                <div class="experience-card-body">
                    <div class="spa-card-top">
                        <div>
                            <p class="spa-card-category">${app.escapeHtml(serviceTypeLabel)}</p>
                            <h4>${app.escapeHtml(service.name)}</h4>
                        </div>
                        <span class="meta-pill">${app.escapeHtml(nextAvailable)}</span>
                    </div>
                    <p>${app.escapeHtml(service.description)}</p>
                    <div class="spa-card-meta">
                        <span class="meta-pill">${app.escapeHtml(app.formatCurrency(service.basePrice))}</span>
                        <span class="meta-pill">${app.escapeHtml(service.duration)} minutes</span>
                    </div>
                    <div class="spa-card-action">
                        <div class="service-price">${app.escapeHtml(app.formatCurrency(service.basePrice))}</div>
                        <button type="button" class="btn btn-outline spa-book-btn" data-service-type="${app.escapeHtml(service.serviceType)}" data-service-id="${app.escapeHtml(service.serviceId)}">Book Treatment</button>
                    </div>
                </div>
            </article>
        `;
        }).join('');

        app.observeCards(grid);
    }

    function populateSpaAddOns() {
        const container = document.getElementById('spaAddOnOptions');
        if (!container) {
            return;
        }

        container.innerHTML = Object.entries(app.state.spaAddOns).map(([id, addOn]) => `
            <label class="addon-option">
                <input type="checkbox" name="spaAddOn" value="${app.escapeHtml(id)}">
                <span>
                    <strong>${app.escapeHtml(addOn.name)}</strong>
                    <small>${app.escapeHtml(app.formatCurrency(addOn.price))}</small>
                </span>
            </label>
        `).join('');
    }

    function populateSpaTimes(selectedTime = '') {
        const select = document.getElementById('spaAppointmentTime');
        const slots = app.state.spaAvailability?.slots || [];
        if (!select) {
            return;
        }

        select.innerHTML = slots.map((slot) => `
            <option value="${app.escapeHtml(slot.time)}" ${slot.isAvailable ? '' : 'disabled'} ${slot.time === selectedTime ? 'selected' : ''}>
                ${app.escapeHtml(slot.label)}${slot.isAvailable ? ` - ${slot.remaining} slots left` : ' - unavailable'}
            </option>
        `).join('');

        if (!selectedTime) {
            const firstAvailable = slots.find((slot) => slot.isAvailable);
            if (firstAvailable) {
                select.value = firstAvailable.time;
            }
        }
    }

    async function loadSpaAvailability(dateValue) {
        const suffix = dateValue ? `?date=${encodeURIComponent(dateValue)}` : '';
        const data = await app.fetchJSON(`/api/spa/availability${suffix}`);
        app.state.spaAvailability = data;

        const summary = document.getElementById('spaAvailabilitySummary');
        if (summary) {
            summary.textContent = data.nextAvailable
                ? `Next available: ${data.nextAvailable.label} on ${app.formatLongDate(data.date)}`
                : `No appointments left on ${app.formatLongDate(data.date)}`;
        }

        populateSpaTimes();
        return data;
    }

    app.loadSpaExperience = async (dateValue) => {
        app.setSectionFeedback('spaSectionStatus', 'Loading spa services and live appointments...');

        try {
            const [serviceData] = await Promise.all([
                app.fetchJSON('/api/spa/services'),
                loadSpaAvailability(dateValue || app.addDays(app.getTodayIso(), 1))
            ]);

            app.state.spaServices = serviceData.serviceList || [];
            app.state.spaAddOns = serviceData.addOns || {};
            populateSpaAddOns();
            renderSpaServices(app.state.spaServices);
            app.setSectionFeedback('spaSectionStatus', 'Spa services and appointment times are ready.', 'success');
        } catch (error) {
            app.setSectionFeedback('spaSectionStatus', error.message || 'Unable to load spa services right now.', 'error');
        }
    };

    function openSpaBooking(button) {
        const service = app.state.spaServices.find((item) => item.serviceType === button.dataset.serviceType && item.serviceId === button.dataset.serviceId);
        if (!service) {
            app.createFloatingMessage('That spa service is not available right now.', { background: '#b33a3a', color: '#ffffff' });
            return;
        }

        document.getElementById('spaServiceType').value = service.serviceType;
        document.getElementById('spaServiceId').value = service.serviceId;
        document.getElementById('spaSelectedServiceName').textContent = service.name;
        document.getElementById('spaSelectedServiceDescription').textContent = service.description;
        document.getElementById('spaSelectedServicePrice').textContent = app.formatCurrency(service.basePrice);
        document.getElementById('spaSelectedServiceDuration').textContent = `${service.duration} minutes`;
        document.getElementById('spaAppointmentDate').value = app.state.spaAvailability?.date || app.addDays(app.getTodayIso(), 1);
        document.querySelectorAll('input[name="spaAddOn"]').forEach((checkbox) => {
            checkbox.checked = false;
        });
        populateSpaTimes();
        setStatus(spaStatus, '');
        app.openModal(spaBookingModal);
    }

    async function submitSpaBooking(event) {
        event.preventDefault();

        const payload = {
            guestName: document.getElementById('spaGuestName').value.trim(),
            guestEmail: document.getElementById('spaGuestEmail').value.trim(),
            guestPhone: document.getElementById('spaGuestPhone').value.trim(),
            serviceType: document.getElementById('spaServiceType').value,
            serviceId: document.getElementById('spaServiceId').value,
            appointmentDate: document.getElementById('spaAppointmentDate').value,
            appointmentTime: document.getElementById('spaAppointmentTime').value,
            therapistPreference: document.getElementById('spaTherapistPreference').value,
            selectedAddOns: Array.from(document.querySelectorAll('input[name="spaAddOn"]:checked')).map((checkbox) => checkbox.value),
            specialRequests: document.getElementById('spaSpecialRequests').value.trim(),
            allergies: document.getElementById('spaAllergies').value.trim(),
            medicalConditions: document.getElementById('spaMedicalConditions').value.trim()
        };

        try {
            setStatus(spaStatus, 'Confirming your spa appointment...');
            spaSubmitButton.disabled = true;
            const result = await app.fetchJSON('/api/spa/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const reference = result.booking.confirmationCode || 'pending confirmation';
            const message = `Spa appointment confirmed. Reference: ${reference}`;

            setStatus(spaStatus, message, 'success');
            spaBookingForm.reset();
            populateSpaAddOns();
            app.createFloatingMessage(message, { background: '#1d7a45', color: '#ffffff' });
            await app.loadSpaExperience(payload.appointmentDate);
            setTimeout(() => app.closeModal(spaBookingModal), 1400);
        } catch (error) {
            setStatus(spaStatus, error.message || 'Unable to complete spa booking right now.', 'error');
        } finally {
            spaSubmitButton.disabled = false;
        }
    }

    app.initBookingAndSpa = async () => {
        document.getElementById('heroBookingForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const checkIn = document.getElementById('checkin').value;
            const checkOut = document.getElementById('checkout').value;
            const guests = document.getElementById('guests').value;

            if (!checkIn || !checkOut || !guests) {
                app.createFloatingMessage('Please fill in all booking details before searching.', { background: '#b33a3a', color: '#ffffff' });
                return;
            }

            if (new Date(checkOut) <= new Date(checkIn)) {
                app.createFloatingMessage('Check-out date must be after check-in date.', { background: '#b33a3a', color: '#ffffff' });
                return;
            }

            await app.loadRoomInventory({ checkIn, checkOut }, { showToast: true });
            app.scrollToSection('rooms');
        });

        document.getElementById('refreshRoomsButton')?.addEventListener('click', () => {
            app.loadRoomInventory(app.getStaySearchCriteria(), { showToast: true });
        });

        document.getElementById('refreshSpaAvailabilityButton')?.addEventListener('click', () => {
            const dateValue = document.getElementById('spaAppointmentDate')?.value || app.addDays(app.getTodayIso(), 1);
            app.loadSpaExperience(dateValue);
        });

        document.getElementById('spaAppointmentDate')?.addEventListener('change', async (event) => {
            try {
                setStatus(spaStatus, 'Refreshing available time slots...');
                await loadSpaAvailability(event.target.value);
                setStatus(spaStatus, '');
            } catch (error) {
                setStatus(spaStatus, error.message || 'Unable to refresh spa slots.', 'error');
            }
        });

        document.addEventListener('click', (event) => {
            const roomButton = event.target.closest('.room-book-btn');
            if (roomButton && !roomButton.disabled) {
                event.preventDefault();
                openRoomBooking(roomButton);
                return;
            }

            const spaButton = event.target.closest('.spa-book-btn');
            if (spaButton) {
                event.preventDefault();
                openSpaBooking(spaButton);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                app.closeModal(bookingModal);
                app.closeModal(spaBookingModal);
            }
        });

        roomBookingForm?.addEventListener('submit', submitRoomBooking);
        spaBookingForm?.addEventListener('submit', submitSpaBooking);
        app.wireModalClosers('[data-booking-close]', bookingModal, () => setStatus(bookingStatus, ''));
        app.wireModalClosers('[data-spa-close]', spaBookingModal, () => setStatus(spaStatus, ''));

        await Promise.all([
            app.loadRoomInventory(app.getStaySearchCriteria()),
            app.loadSpaExperience(app.addDays(app.getTodayIso(), 1))
        ]);
    };
})();
