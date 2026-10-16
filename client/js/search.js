// search.js - search page logic

document.addEventListener('DOMContentLoaded', function () {
    renderNavbar('search');
    renderFooter();
    loadCategories();

    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    document.getElementById('clearBtn').addEventListener('click', handleClear);
});

// Populate the category dropdown
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) throw new Error('Could not load categories');

        const categories = await response.json();
        const select = document.getElementById('searchCategory');

        categories.forEach(function (cat) {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Failed to load categories:', error);
        showError('Failed to load event categories. Please refresh the page.');
    }
}

// Handle the search form submission
async function handleSearch(e) {
    e.preventDefault();

    const resultsContainer = document.getElementById('results-container');
    const errorBox = document.getElementById('errorBox');

    errorBox.style.display = 'none';
    resultsContainer.innerHTML = '<p class="loading">Searching...</p>';

    const date = document.getElementById('searchDate').value;
    const location = document.getElementById('searchLocation').value.trim();
    const category = document.getElementById('searchCategory').value;

    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (location) params.append('location', location);
    if (category) params.append('category', category);

    try {
        const response = await fetch(`${API_BASE}/events/search?${params.toString()}`);

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Search failed');
        }

        const events = await response.json();

        if (events.length === 0) {
            resultsContainer.innerHTML = `
                <p class="no-results">
                    No events found matching your criteria.
                    <br>Try adjusting your filters.
                </p>`;
        } else {
            resultsContainer.innerHTML = `
                <p style="margin-bottom: 0.5rem; color: #9c7f6e;">
                    Found ${events.length} event(s):
                </p>
            `;
            renderSearchResults(events, resultsContainer);
        }

    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '';
        showError(error.message);
    }
}

// Render search results as cards (with entrance animation)
function renderSearchResults(events, container) {
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
    container.innerHTML += html;
}

// Convert the API status value to a display label
function statusLabel(status) {
    if (status === 'ongoing') return 'Ongoing';
    if (status === 'past') return 'Past';
    return 'Upcoming';
}

// Reset all filters
function handleClear() {
    document.getElementById('searchDate').value = '';
    document.getElementById('searchLocation').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('errorBox').style.display = 'none';
    document.getElementById('results-container').innerHTML =
        '<p class="loading">Use the filters above to find events.</p>';
}

// Show an error message
function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}
