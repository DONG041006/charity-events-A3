// common.js - shared helper functions and navigation

const API_BASE = 'http://localhost:3000/api';

// Render the navigation bar into the #navbar element
function renderNavbar(activePage) {
    const navContainer = document.getElementById('navbar');
    if (!navContainer) return;

    navContainer.innerHTML = `
        <nav class="navbar">
            <a href="index.html" class="logo">
                <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                    <defs>
                        <linearGradient id="lgHeart" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#fbbf24"/>
                            <stop offset="1" stop-color="#e2593f"/>
                        </linearGradient>
                    </defs>
                    <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lgHeart)"/>
                    <path d="M16 24.5S9.2 20.2 6.8 16.2C4.7 12.9 6.4 9.5 9.6 9.5c2 0 3.3 1.1 4.1 2.5.8-1.4 2.1-2.5 4.1-2.5 3.2 0 4.9 3.4 2.8 6.7C19.2 20.2 16 24.5 16 24.5z" fill="#fff"/>
                    <circle cx="22.5" cy="8" r="1.9" fill="#fff" opacity="0.9"/>
                </svg>
                <span>Charity Events</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
                <li><a href="search.html" class="${activePage === 'search' ? 'active' : ''}">Search Events</a></li>
            </ul>
        </nav>
    `;
}

// Format a date string for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format a number as a currency value
function formatCurrency(amount) {
    return '$' + Number(amount).toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Read a query parameter from the current URL
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Render the footer into the #footer element
function renderFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;

    footer.innerHTML = `
        <footer class="footer">
            <div class="footer-grid">
                <div class="footer-col">
                    <h4>Charity Events</h4>
                    <p>Connecting people with meaningful causes, one event at a time.</p>
                </div>
                <div class="footer-col">
                    <h4>Contact Us</h4>
                    <p>Phone: (02) 9000 1234</p>
                    <p>Email: info@charityevents.org.au</p>
                    <p>Level 3, 100 George Street, Sydney NSW 2000</p>
                </div>
                <div class="footer-col">
                    <h4>Navigate</h4>
                    <a href="index.html">Home</a>
                    <a href="search.html">Search Events</a>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; 2026 Charity Events &nbsp;|&nbsp; PROG2002 A2 - Web Development II
            </div>
        </footer>
    `;
}

// Animate a counter from 0 to a target value
function animateNumber(elementId, target, isCurrency) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const duration = 1200;
    const start = performance.now();

    function setFinal() {
        el.textContent = isCurrency ? formatCurrency(target) : String(target);
    }

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = isCurrency ? formatCurrency(value) : String(value);
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            setFinal();
        }
    }
    requestAnimationFrame(tick);
    // Fallback: guarantee the final value even if the animation frame loop
    // is throttled (e.g. the tab is in the background).
    setTimeout(setFinal, duration + 150);
}
