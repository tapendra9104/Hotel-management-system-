(() => {
    const app = window.GrandStayApp;
    if (!app) {
        return;
    }

    const foodOrderModal = document.getElementById('foodOrderModal');
    const foodOrderForm = document.getElementById('foodOrderForm');
    const foodSubmitButton = document.getElementById('foodOrderSubmitButton');
    const foodStatus = document.getElementById('foodOrderStatus');

    function setStatus(message = '', tone = '') {
        if (!foodStatus) {
            return;
        }

        foodStatus.textContent = message;
        foodStatus.classList.remove('is-error', 'is-success');
        if (tone) {
            foodStatus.classList.add(`is-${tone}`);
        }
    }

    function renderDiningMenu(menu) {
        const grid = document.getElementById('diningMenuGrid');
        if (!grid) {
            return;
        }

        grid.innerHTML = menu.map((item) => {
            const image = item.image || app.getImageConfigByPath('facilities.dining')?.url || '';
            const imageAlt = item.imageAlt || `${item.name} from GrandStay room service`;

            return `
                <article class="menu-card">
                    <div class="experience-card-media-wrap">
                        <img class="experience-card-media" src="${app.escapeHtml(image)}" alt="${app.escapeHtml(imageAlt)}" loading="lazy">
                    </div>
                    <div class="experience-card-body">
                        <div class="menu-card-header">
                            <div>
                                <p class="menu-card-category">${app.escapeHtml(item.category)}</p>
                                <h4>${app.escapeHtml(item.name)}</h4>
                            </div>
                            <span class="meta-pill">${app.escapeHtml(item.serviceWindow)}</span>
                        </div>
                        <p>${app.escapeHtml(item.description)}</p>
                        <div class="menu-card-meta">
                            <span class="meta-pill">${app.escapeHtml((item.dietary || []).join(' | ') || item.category)}</span>
                        </div>
                        <div class="menu-card-footer">
                            <div>
                                <div class="menu-price">${app.escapeHtml(app.formatCurrency(item.price))}</div>
                                <div class="menu-dietary">${app.escapeHtml(item.category)}</div>
                            </div>
                            <button type="button" class="btn btn-outline food-order-btn" data-menu-id="${app.escapeHtml(item.id)}">Add to Order</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        app.observeCards(grid);
    }

    function buildFoodOptionMarkup(selectedItemId = '') {
        return app.state.foodMenu.map((item) => `
            <label class="food-order-row">
                <span class="food-order-copy">
                    <strong>${app.escapeHtml(item.name)}</strong>
                    <small>${app.escapeHtml(item.category)} | ${app.escapeHtml(app.formatCurrency(item.price))}</small>
                </span>
                <input type="number" min="0" max="10" step="1" class="food-order-qty" data-menu-id="${app.escapeHtml(item.id)}" value="${item.id === selectedItemId ? 1 : 0}" aria-label="Quantity for ${app.escapeHtml(item.name)}">
            </label>
        `).join('');
    }

    function openFoodOrder(menuId = '') {
        const selectedItem = app.state.foodMenu.find((item) => item.id === menuId);
        document.getElementById('foodSelectedSummary').textContent = selectedItem
            ? `${selectedItem.name} has been added for you. Adjust quantities or add more dishes before submitting your order.`
            : 'Select one or more dishes below and send your order directly to the kitchen.';
        document.getElementById('foodEstimatedDelivery').textContent = `${app.state.foodSettings?.averageDeliveryMinutes || 35} minutes`;
        document.getElementById('foodOrderMenuOptions').innerHTML = buildFoodOptionMarkup(menuId);
        setStatus('');
        app.openModal(foodOrderModal);
    }

    app.loadDiningExperience = async () => {
        app.setSectionFeedback('foodSectionStatus', 'Loading live room-service menu...');

        try {
            const data = await app.fetchJSON('/api/food/menu');
            app.state.foodMenu = data.menu || [];
            app.state.foodSettings = data.settings || null;
            renderDiningMenu(app.state.foodMenu);
            document.getElementById('foodDeliverySummary').textContent = `${data.settings.serviceHours} | average delivery ${data.settings.averageDeliveryMinutes} minutes`;
            app.setSectionFeedback('foodSectionStatus', 'Room-service ordering is ready.', 'success');
        } catch (error) {
            app.setSectionFeedback('foodSectionStatus', error.message || 'Unable to load the dining menu right now.', 'error');
        }
    };

    async function submitFoodOrder(event) {
        event.preventDefault();

        const items = Array.from(document.querySelectorAll('.food-order-qty'))
            .map((input) => ({ itemId: input.dataset.menuId, quantity: Number(input.value) || 0 }))
            .filter((item) => item.quantity > 0);

        const payload = {
            guestName: document.getElementById('foodGuestName').value.trim(),
            guestEmail: document.getElementById('foodGuestEmail').value.trim(),
            guestPhone: document.getElementById('foodGuestPhone').value.trim(),
            roomNumber: document.getElementById('foodRoomNumber').value.trim(),
            deliveryTime: document.getElementById('foodDeliveryTime').value,
            items,
            notes: document.getElementById('foodOrderNotes').value.trim()
        };

        try {
            setStatus('Sending your order to the kitchen...');
            foodSubmitButton.disabled = true;
            const result = await app.fetchJSON('/api/food/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const message = `Order confirmed. Reference: ${result.order.orderId}`;

            setStatus(message, 'success');
            foodOrderForm.reset();
            document.getElementById('foodOrderMenuOptions').innerHTML = buildFoodOptionMarkup();
            app.createFloatingMessage(`${message}. Estimated delivery ${result.order.estimatedDeliveryTime}.`, {
                background: '#1d7a45',
                color: '#ffffff'
            });
            setTimeout(() => app.closeModal(foodOrderModal), 1400);
        } catch (error) {
            setStatus(error.message || 'Unable to place the food order right now.', 'error');
        } finally {
            foodSubmitButton.disabled = false;
        }
    }

    app.initDining = async () => {
        document.getElementById('startFoodOrderButton')?.addEventListener('click', () => {
            openFoodOrder();
        });

        document.addEventListener('click', (event) => {
            const foodButton = event.target.closest('.food-order-btn');
            if (foodButton) {
                event.preventDefault();
                openFoodOrder(foodButton.dataset.menuId);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                app.closeModal(foodOrderModal);
            }
        });

        foodOrderForm?.addEventListener('submit', submitFoodOrder);
        app.wireModalClosers('[data-food-close]', foodOrderModal, () => setStatus(''));
        await app.loadDiningExperience();
    };
})();
