// registration.js - event registration page logic
// Reads the event id from the ?id= query parameter, shows the event info,
// and submits a new registration to the backend API.

// Initialise once the DOM is ready (or immediately if loaded late).
function initRegistration() {
    renderNavbar('');
    renderFooter();

    const eventId = getQueryParam('id');

    if (!eventId) {
        document.getElementById('event-info').innerHTML =
            '<div class="error-message">No event selected. Please choose an event from the <a href="index.html">homepage</a>.</div>';
        return;
    }

    loadEventInfo(eventId);
    bindRegistrationForm(eventId);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegistration);
} else {
    initRegistration();
}

/**
 * Load and display the details of the selected event on the registration page.
 * Uses the existing GET /api/events/:id endpoint.
 */
async function loadEventInfo(eventId) {
    const container = document.getElementById('event-info');

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);

        if (response.status === 404) {
            container.innerHTML =
                '<div class="error-message">Event not found. It may have been removed.</div>';
            return;
        }
        if (!response.ok) throw new Error('Server error');

        const event = await response.json();

        container.innerHTML = `
            <div class="registration-event">
                <h1 class="detail-title">${event.title}</h1>
                <div class="detail-meta"><span class="card-category">${event.category_name}</span></div>
                <div class="detail-info-grid">
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

    } catch (error) {
        console.error('Failed to load event info:', error);
        container.innerHTML =
            `<div class="error-message">Failed to load event information: ${error.message}</div>`;
    }
}

/**
 * Bind the submit handler on the registration form: validate the input,
 * POST the new registration to the API, show a confirmation on success
 * and navigate back to the event detail page.
 */
function bindRegistrationForm(eventId) {
    const form = document.getElementById('registration-form');
    const message = document.getElementById('form-message');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const fullName = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const tickets = parseInt(document.getElementById('tickets').value, 10);

        // Client-side validation
        if (!fullName) {
            alert('Please enter your full name.');
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        if (!tickets || tickets < 1) {
            alert('Please enter the number of tickets (at least 1).');
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        message.innerHTML = '<p class="loading">Submitting your registration...</p>';

        try {
            const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    phone: phone || null,
                    tickets_purchased: tickets
                })
            });

            const data = await response.json();

            // Duplicate registration for the same (event, email)
            if (response.status === 409) {
                alert(data.error || 'You have already registered for this event.');
                button.disabled = false;
                return;
            }
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Success: show a confirmation message, then navigate back to the detail page
            message.innerHTML = `
                <div class="success-message">
                    <h3>Registration Successful!</h3>
                    <p>Thank you, <strong>${fullName}</strong>. You have registered
                    <strong>${tickets}</strong> ticket(s) for this event.</p>
                    <p>You will be redirected back to the event page shortly.</p>
                </div>
            `;

            setTimeout(function () {
                window.location.href = `detail.html?id=${eventId}`;
            }, 2500);

        } catch (error) {
            console.error('Registration error:', error);
            message.innerHTML = `<div class="error-message">Registration failed: ${error.message}</div>`;
            button.disabled = false;
        }
    });
}
