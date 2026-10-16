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

            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn btn-primary" style="padding: 0.8rem 3rem; font-size: 1.1rem;"
                        onclick="registerForEvent('${event.title}')">
                    Register Now
                </button>
            </div>
        </div>
    `;
}

// Registration is not implemented in this assessment
function registerForEvent(eventTitle) {
    alert(`"${eventTitle}" registration is under construction. This feature will be available soon!`);
}
