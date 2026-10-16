// index.js - homepage logic: load and display upcoming/ongoing events

document.addEventListener('DOMContentLoaded', function () {
    renderNavbar('home');
    renderFooter();
    loadUpcomingEvents();
});

async function loadUpcomingEvents() {
    const container = document.getElementById('events-container');

    try {
        const response = await fetch(`${API_BASE}/events/upcoming`);

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

    } catch (error) {
        console.error('Failed to load events:', error);
        container.innerHTML = `
            <div class="error-message">
                Failed to load events. Please make sure the server is running.
                <br>Error: ${error.message}
            </div>
        `;
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
