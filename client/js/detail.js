// detail.js - event detail page logic
// Reads the event id from the ?id= query parameter and loads the event

document.addEventListener('DOMContentLoaded', function () {
    renderNavbar('');
    renderFooter();

    const eventId = getQueryParam('id');

    if (!eventId) {
        document.getElementById('detail-container').innerHTML =
            '<div class="error-message">No event ID provided. Please go back and select an event.</div>';
        return;
    }

    loadEventDetail(eventId);
});

async function loadEventDetail(eventId) {
    const container = document.getElementById('detail-container');

    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);

        if (response.status === 404) {
            container.innerHTML =
                '<div class="error-message">Event not found. It may have been removed.</div>';
            return;
        }

        if (!response.ok) throw new Error('Server error');

        const event = await response.json();

        renderEventDetail(event);

    } catch (error) {
        console.error('Failed to load event details:', error);
        container.innerHTML = `
            <div class="error-message">
                Failed to load event details. ${error.message}
            </div>
        `;
    }
}

function renderEventDetail(event) {
    const container = document.getElementById('detail-container');

    const progress = event.target_amount > 0
        ? Math.min(100, Math.round((event.raised_amount / event.target_amount) * 100))
        : 0;

    let statusBadge = '';
    switch (event.status) {
        case 'upcoming':
            statusBadge = '<span style="background:#fdeee6;color:#c2410c;padding:3px 12px;border-radius:999px;font-size:0.85rem;">Upcoming</span>';
            break;
        case 'ongoing':
            statusBadge = '<span style="background:#e8f8e8;color:#27ae60;padding:3px 12px;border-radius:999px;font-size:0.85rem;">Ongoing</span>';
            break;
        case 'completed':
            statusBadge = '<span style="background:#f0f0f0;color:#7f8c8d;padding:3px 12px;border-radius:999px;font-size:0.85rem;">Completed</span>';
            break;
        case 'paused':
            statusBadge = '<span style="background:#fbe9e5;color:#a63c28;padding:3px 12px;border-radius:999px;font-size:0.85rem;">Paused</span>';
            break;
    }

    const imgHtml = '';

    container.innerHTML = `
        <div class="detail-container">
            ${imgHtml}
            <h1 class="detail-title">${event.title}</h1>
            <div class="detail-meta">
                <span class="card-category">${event.category_name}</span>
                ${statusBadge}
            </div>

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

            <div class="weather-block">
                <h3>Local Weather Forecast</h3>
                <div id="weather-container" class="weather-list">Loading forecast...</div>
            </div>

            <h3 style="margin-top: 1.5rem;">About This Event</h3>
            <p class="detail-description">${event.description}</p>

            <h3>Fundraising Progress</h3>
            <p style="margin-bottom: 0.3rem;">
                Raised: <strong>${formatCurrency(event.raised_amount)}</strong>
                of <strong>${formatCurrency(event.target_amount)}</strong>
                (${progress}%)
            </p>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${progress}%;">${progress}%</div>
            </div>

            <h3 style="margin-top: 2rem;">Registrations (${event.registrations.length})</h3>
            <div class="registrations-list">
                ${event.registrations.length > 0
                    ? event.registrations.map(function (reg) {
                        return `<div class="registration-item">
                            <span class="reg-name">${reg.full_name}</span>
                            <span class="reg-meta">${reg.tickets_purchased} ticket(s)</span>
                            <span class="reg-meta">${formatDate(reg.registration_date)}</span>
                        </div>`;
                    }).join('')
                    : '<p class="no-results">No registrations yet.</p>'}
            </div>

            <div style="margin-top: 2rem; text-align: center;">
                <a href="registration.html?id=${event.id}" class="btn btn-primary"
                   style="padding: 0.8rem 3rem; font-size: 1.1rem; display: inline-block;">
                    Register Now
                </a>
            </div>
        </div>
    `;

    if (event.latitude != null && event.longitude != null) {
        loadWeather(event);
    }
}

/**
 * Fetch a 3-day weather forecast from Open-Meteo for the event's location
 * and render it into the #weather-container element. This is the external
 * Weather API enhancement (free, no API key required).
 */
async function loadWeather(event) {
    const el = document.getElementById('weather-container');
    if (!el) return;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${event.latitude}&longitude=${event.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Australia%2FSydney&forecast_days=3`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('weather ' + response.status);

        const data = await response.json();
        const daily = data.daily;
        if (!daily || !daily.weather_code || daily.weather_code.length === 0) {
            throw new Error('no weather data');
        }

        const days = daily.weather_code.map(function (code, i) {
            const date = new Date(daily.time[i]);
            const weekday = date.toLocaleDateString('en-AU', { weekday: 'short' });
            return `
                <div class="weather-day">
                    <span class="weather-date">${weekday}</span>
                    <span class="weather-ico">${weatherIcon(code)}</span>
                    <span class="weather-text">${weatherLabel(code)}</span>
                    <span class="weather-temp">${Math.round(daily.temperature_2m_min[i])}° – ${Math.round(daily.temperature_2m_max[i])}°C</span>
                </div>`;
        }).join('');

        el.innerHTML = days;

    } catch (error) {
        console.error('Weather load failed:', error);
        el.innerHTML = '<p class="no-results">Weather unavailable at the moment.</p>';
    }
}

// Navigate to the registration page for the selected event
function registerForEvent(eventId) {
    window.location.href = `registration.html?id=${eventId}`;
}
