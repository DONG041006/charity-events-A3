// index.js - homepage logic: load and display upcoming/ongoing events

// Initialise the homepage once the document is ready (or immediately if the
// script was loaded after the DOM had already been parsed).
function initHome() {
    renderNavbar('home');
    renderFooter();
    loadUpcomingEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHome);
} else {
    initHome();
}

/**
 * Load the upcoming/ongoing events from the API and render them into the
 * homepage. The request is retried with a timeout so that a slow cold start
 * never leaves the page stuck on the loading message.
 */
async function loadUpcomingEvents() {
    const container = document.getElementById('events-container');
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(function () { controller.abort(); }, 8000);

        try {
            const response = await fetch(`${API_BASE}/events/upcoming`, { signal: controller.signal });
            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const events = await response.json();

            if (events.length === 0) {
                container.innerHTML = '<p class="no-results">No upcoming events at the moment. Please check back later.</p>';
                return;
            }

            renderStats(events);
            renderEventCards(events, container);
            loadCardWeather(events);
            return;

        } catch (error) {
            clearTimeout(timer);

            if (attempt === maxAttempts) {
                console.error('Failed to load events:', error);
                container.innerHTML = `
                    <div class="error-message">
                        Failed to load events. Please make sure the server is running.
                        <br>Error: ${error.message}
                    </div>
                `;
            } else {
                await new Promise(function (resolve) { setTimeout(resolve, 1500); });
            }
        }
    }
}

// Compute and animate the stats strip from the loaded events
function renderStats(events) {
    let raised = 0;
    let goal = 0;
    events.forEach(function (event) {
        raised += Number(event.raised_amount) || 0;
        goal += Number(event.target_amount) || 0;
    });
    animateNumber('statEvents', events.length, false);
    animateNumber('statRaised', raised, true);
    animateNumber('statGoal', goal, true);
}

// Render a list of events as cards (with entrance animation)
function renderEventCards(events, container) {
    let html = '<div class="events-grid">';

    events.forEach(function (event, index) {
        const progress = event.target_amount > 0
            ? Math.round((event.raised_amount / event.target_amount) * 100)
            : 0;
        const img = event.image_url
            ? `<div class="card-image"><img src="${event.image_url}" alt="${event.title}" loading="lazy"></div>`
            : '';

        html += `
            <div class="event-card card-animate" style="animation-delay: ${index * 90}ms;">
                ${img}
                <div class="card-body">
                    <div class="card-top">
                        <span class="card-category">${event.category_name}</span>
                        <span class="status-badge status-${event.display_status || 'upcoming'}">${statusLabel(event.display_status)}</span>
                    </div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-meta">${formatDate(event.event_date)}</p>
                    <p class="card-meta">${event.location}</p>
                    <p class="card-meta">${event.organization_name}</p>
                    <p class="card-price">${formatCurrency(event.ticket_price)}</p>
                    <div class="card-weather" data-lat="${event.latitude}" data-lon="${event.longitude}">—</div>
                    <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progress}%;"></div></div>
                    <p class="progress-text">Raised ${formatCurrency(event.raised_amount)} of ${formatCurrency(event.target_amount)} (${progress}%)</p>
                    <a href="detail.html?id=${event.id}" class="btn btn-primary" style="margin-top: 0.9rem; padding: 0.45rem 1.2rem; font-size: 0.9rem;">
                        View Details
                    </a>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Convert the API status value to a display label
function statusLabel(status) {
    if (status === 'ongoing') return 'Ongoing';
    if (status === 'past') return 'Past';
    return 'Upcoming';
}

/**
 * Batch-load a one-day weather label for every visible event card from
 * Open-Meteo (free, CORS-enabled, no API key). Cards without coordinates
 * are left untouched; failures are silent so the cards still render.
 */
async function loadCardWeather(events) {
    const cards = document.querySelectorAll('.card-weather');
    if (cards.length === 0) return;

    const withCoords = events.filter(function (e) {
        return e.latitude != null && e.longitude != null;
    });
    if (withCoords.length === 0) return;

    try {
        const lats = withCoords.map(function (e) { return e.latitude; }).join(',');
        const lons = withCoords.map(function (e) { return e.longitude; }).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=temperature_2m_max,weather_code&timezone=Australia%2FSydney&forecast_days=1`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('weather ' + response.status);

        const data = await response.json();
        const dailies = Array.isArray(data.daily) ? data.daily : [data.daily];

        withCoords.forEach(function (ev, i) {
            const d = dailies[i];
            if (!d || !d.weather_code || !d.weather_code[0]) return;
            const code = d.weather_code[0];
            const text = `${weatherIcon(code)} ${Math.round(d.temperature_2m_max[0])}°C ${weatherLabel(code)}`;
            cards.forEach(function (card) {
                if (card.dataset.lat === String(ev.latitude) && card.dataset.lon === String(ev.longitude)) {
                    card.textContent = text;
                }
            });
        });

    } catch (error) {
        // Weather is an enhancement only; leave cards showing the placeholder.
        console.error('Card weather load failed:', error);
    }
}
