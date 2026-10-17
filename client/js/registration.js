// registration.js - event registration page logic
//
// Reads the event id from the ?id= query parameter, shows a summary of the
// event, and lets the user submit a registration (ticket purchase) via
// POST /api/events/:id/register.

/** @type {Object|null} The event currently being registered for. */
let currentEvent = null;

/**
 * Initialise the registration page once the DOM is ready.
 * Reads the event id from the query string and loads the event, or shows a
 * fatal error when no id was supplied.
 * @returns {void}
 */
document.addEventListener('DOMContentLoaded', function () {
    renderNavbar('');
    renderFooter();

    const eventId = getQueryParam('id');

    if (!eventId) {
        showPageError('No event ID provided. Please go back and select an event.');
        return;
    }

    loadEventForRegistration(eventId);
});

/**
 * Load the event summary, then reveal and wire up the registration form.
 * @param {string|number} eventId - The id of the event to register for.
 * @returns {Promise<void>}
 */
async function loadEventForRegistration(eventId) {
    const summary = document.getElementById('event-summary');

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);

        if (response.status === 404) {
            showPageError('Event not found. It may have been removed.');
            return;
        }
        if (!response.ok) throw new Error('Server error');

        currentEvent = await response.json();
        renderEventSummary(currentEvent);

        // Reveal the form and attach behaviour
        document.getElementById('registration-card').style.display = 'block';
        document.getElementById('viewDetailLink').href = `detail.html?id=${currentEvent.id}`;

        const ticketsInput = document.getElementById('tickets');
        ticketsInput.addEventListener('input', updateTotal);
        updateTotal();

        document.getElementById('registrationForm')
            .addEventListener('submit', handleSubmit);

    } catch (error) {
        console.error('Failed to load event for registration:', error);
        summary.innerHTML =
            '<div class="error-message">Failed to load event details. Please make sure the server is running.</div>';
    }
}

/**
 * Render the compact event summary card above the registration form.
 * @param {Object} event - The event object returned by GET /api/events/:id.
 * @returns {void}
 */
function renderEventSummary(event) {
    const summary = document.getElementById('event-summary');
    summary.innerHTML = `
        <div class="detail-container">
            <div class="detail-meta" style="margin-bottom:0.8rem;">
                <span class="card-category">${event.category_name}</span>
            </div>
            <h1 class="detail-title" style="font-size:1.5rem;">${event.title}</h1>
            <div class="detail-info-grid" style="margin-top:1rem;">
                <div class="detail-info-item">
                    <div class="label">Event Date</div>
                    <div class="value">${formatDate(event.event_date)}</div>
                </div>
                <div class="detail-info-item">
                    <div class="label">Location</div>
                    <div class="value">${event.location}</div>
                </div>
                <div class="detail-info-item">
                    <div class="label">Organized by</div>
                    <div class="value">${event.organization_name}</div>
                </div>
                <div class="detail-info-item">
                    <div class="label">Ticket Price</div>
                    <div class="value">${formatCurrency(event.ticket_price)}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Recalculate the order total from the ticket price and selected quantity.
 * Free events (price 0) are displayed as "Free".
 * @returns {void}
 */
function updateTotal() {
    if (!currentEvent) return;

    const ticketsInput = document.getElementById('tickets');
    let quantity = parseInt(ticketsInput.value, 10);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 10) quantity = 10;

    const price = Number(currentEvent.ticket_price) || 0;
    const total = price * quantity;
    const totalEl = document.getElementById('totalPrice');

    totalEl.textContent = price === 0 ? 'Free' : formatCurrency(total);
}

/**
 * Validate the form and POST the registration to the API.
 * Handles 201 (success), 400 (validation), 404 (missing event) and
 * 409 (duplicate registration) responses.
 * @param {Event} event - The form submit event.
 * @returns {Promise<void>}
 */
async function handleSubmit(event) {
    event.preventDefault();

    const formError = document.getElementById('formError');
    formError.style.display = 'none';

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    let tickets = parseInt(document.getElementById('tickets').value, 10);

    // ---- Client-side validation ----
    if (!fullName) {
        return showFormError('Please enter your full name.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showFormError('Please enter a valid email address.');
    }
    if (isNaN(tickets) || tickets < 1 || tickets > 10) {
        return showFormError('Number of tickets must be between 1 and 10.');
    }

    const payload = {
        full_name: fullName,
        email: email,
        phone: phone || null,
        tickets_purchased: tickets
    };

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_BASE}/events/${currentEvent.id}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 201) {
            showSuccess(data, payload);
            return;
        }

        // 400 = validation, 409 = duplicate, 404 = missing event, else server error
        if (response.status === 409) {
            showFormError(data.error || 'You have already registered for this event.');
        } else if (response.status === 404) {
            showFormError(data.error || 'Event not found.');
        } else if (response.status === 400) {
            showFormError(data.error || 'Please check the details you entered.');
        } else {
            showFormError(data.error || 'Registration failed. Please try again later.');
        }
    } catch (error) {
        console.error('Registration request failed:', error);
        showFormError('Could not reach the server. Please make sure it is running and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Registration';
    }
}

/**
 * Show the confirmation panel after a successful registration.
 * @param {Object} data - The successful response body (contains the new id).
 * @param {Object} payload - The registration payload that was submitted.
 * @param {string} payload.full_name - Registrant's full name.
 * @param {string} payload.email - Registrant's email.
 * @param {number} payload.tickets_purchased - Number of tickets bought.
 * @returns {void}
 */
function showSuccess(data, payload) {
    document.getElementById('registration-card').style.display = 'none';
    document.getElementById('event-summary').style.display = 'none';

    const price = Number(currentEvent.ticket_price) || 0;
    const total = price * payload.tickets_purchased;
    const totalLabel = price === 0 ? 'Free event' : formatCurrency(total);

    document.getElementById('success-message').textContent =
        `Thank you, ${payload.full_name}! Your registration for "${currentEvent.title}" has been received.`;

    document.getElementById('success-details').innerHTML = `
        <p style="margin-bottom:0.4rem;"><strong>Registration #:</strong> ${data.id ?? '—'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Name:</strong> ${escapeHtml(payload.full_name)}</p>
        <p style="margin-bottom:0.4rem;"><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        <p style="margin-bottom:0.4rem;"><strong>Tickets:</strong> ${payload.tickets_purchased}</p>
        <p style="margin-bottom:0;"><strong>Total:</strong> ${totalLabel}</p>
    `;

    document.getElementById('success-panel').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Show a fatal error that replaces the whole registration area.
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showPageError(message) {
    document.getElementById('event-summary').style.display = 'none';
    document.getElementById('registration-card').style.display = 'none';
    const box = document.getElementById('reg-error');
    box.textContent = message;
    box.style.display = 'block';
}

/**
 * Show a validation or submission error inside the form.
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showFormError(message) {
    const formError = document.getElementById('formError');
    formError.textContent = message;
    formError.style.display = 'block';
    formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Escape user-supplied text so it can be safely inserted into innerHTML.
 * @param {string} text - The raw text to escape.
 * @returns {string} The HTML-escaped text.
 */
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
