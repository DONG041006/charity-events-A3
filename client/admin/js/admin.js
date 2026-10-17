// admin.js - admin dashboard logic (full CRUD for charity events)
//
// Talks to the same REST API as the public site:
//   GET    /api/events/upcoming   list active events
//   GET    /api/categories        categories for the dropdown
//   GET    /api/events/:id        full event (used when editing)
//   POST   /api/events            create an event
//   PUT    /api/events/:id        update an event
//   DELETE /api/events/:id        delete an event (409 if registrations exist)

const API_BASE = '/api';

// The API does not expose an organizations endpoint, so the organization
// dropdown uses the same organizations seeded in server/schema.sql
// (Hope Foundation, Green Earth Charity, Community Care Network).
const ORGANIZATIONS = [
    { id: 1, name: 'Hope Foundation' },
    { id: 2, name: 'Green Earth Charity' },
    { id: 3, name: 'Community Care Network' }
];

// Images shipped with the client (client/images). Values are stored relative
// to the client root, exactly as in schema.sql seed data.
const IMAGE_OPTIONS = [
    'images/dinner1.jpg',
    'images/run1.jpg',
    'images/auction1.jpg',
    'images/online1.jpg',
    'images/online2.jpg',
    'images/volunteer1.jpg'
];

let editingId = null;      // null = creating, otherwise the id being edited
let eventsCache = [];      // latest loaded events (used to resolve titles)
let messageTimer = null;

document.addEventListener('DOMContentLoaded', function () {
    populateOrganizations();
    populateImageOptions();
    updateImagePreview();
    loadCategories();
    loadEvents();
    bindEvents();
});

function bindEvents() {
    document.getElementById('newEventBtn').addEventListener('click', newEvent);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('eventForm').addEventListener('submit', handleSubmit);
    document.getElementById('imageUrl').addEventListener('change', updateImagePreview);
}

/* ---------------- Dropdown population ---------------- */

function populateOrganizations() {
    const sel = document.getElementById('organization');
    sel.innerHTML = '<option value="">-- Select organization --</option>' +
        ORGANIZATIONS.map(function (o) {
            return `<option value="${o.id}">${escapeHtml(o.name)}</option>`;
        }).join('');
}

function populateImageOptions() {
    const sel = document.getElementById('imageUrl');
    sel.innerHTML = '<option value="">No image</option>' +
        IMAGE_OPTIONS.map(function (src) {
            return `<option value="${src}">${src.replace('images/', '')}</option>`;
        }).join('');
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) throw new Error('Could not load categories');
        const categories = await res.json();

        const sel = document.getElementById('category');
        sel.innerHTML = '<option value="">-- Select category --</option>' +
            categories.map(function (c) {
                return `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
            }).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
        showMessage('Failed to load categories. Please refresh the page.', 'error');
    }
}

/* ---------------- Events listing ---------------- */

async function loadEvents() {
    const container = document.getElementById('eventsTableContainer');
    container.innerHTML = '<p class="loading">Loading events...</p>';

    try {
        const res = await fetch(`${API_BASE}/events/upcoming`);
        if (!res.ok) throw new Error('Could not load events');
        const events = await res.json();

        eventsCache = events;
        document.getElementById('listCount').textContent = `${events.length} event(s)`;

        if (events.length === 0) {
            container.innerHTML =
                '<p class="no-results">No active events found. Create one to get started.</p>';
            return;
        }

        renderTable(events);
    } catch (error) {
        console.error('Failed to load events:', error);
        container.innerHTML =
            '<div class="form-error">Failed to load events. Please make sure the server is running.</div>';
    }
}

function renderTable(events) {
    const rows = events.map(function (ev) {
        return `
            <tr>
                <td class="col-id">#${ev.id}</td>
                <td class="event-title-cell">${escapeHtml(ev.title)}
                    <span class="event-sub">${escapeHtml(ev.category_name || '')}</span>
                </td>
                <td>${escapeHtml(ev.organization_name || '')}</td>
                <td>${formatEventDate(ev.event_date)}</td>
                <td>${escapeHtml(ev.location || '')}</td>
                <td>${money(ev.ticket_price)}</td>
                <td><span class="badge badge-${ev.status}">${ev.status}</span></td>
                <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" onclick="editEvent(${ev.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEvent(${ev.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('eventsTableContainer').innerHTML = `
        <div class="table-scroll">
            <table class="events-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Event</th>
                        <th>Organization</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

/* ---------------- Create / Edit ---------------- */

function newEvent() {
    editingId = null;
    resetForm();
    document.getElementById('formHeading').textContent = 'Create New Event';
    document.getElementById('saveBtn').textContent = 'Create Event';
    showForm();
    document.getElementById('eventFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function editEvent(id) {
    try {
        const res = await fetch(`${API_BASE}/events/${id}`);
        if (res.status === 404) {
            showMessage('Event not found.', 'error');
            return;
        }
        if (!res.ok) throw new Error('Could not load event');

        const ev = await res.json();
        editingId = id;

        setVal('title', ev.title);
        setVal('organization', ev.organization_id);
        setVal('category', ev.category_id);
        setVal('description', ev.description || '');
        setVal('eventDate', toDatetimeLocalValue(ev.event_date));
        setVal('location', ev.location);
        setVal('ticketPrice', ev.ticket_price);
        setVal('targetAmount', ev.target_amount);
        setVal('raisedAmount', ev.raised_amount);
        setVal('status', ev.status);
        setVal('imageUrl', ev.image_url || '');
        updateImagePreview();

        document.getElementById('formHeading').textContent = `Edit Event #${id}`;
        document.getElementById('saveBtn').textContent = 'Update Event';
        hideFieldError();
        showForm();
        document.getElementById('eventFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Failed to load event for editing:', error);
        showMessage('Failed to load event details.', 'error');
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    hideFieldError();

    const title = val('title');
    const organizationId = parseInt(val('organization'), 10);
    const categoryId = parseInt(val('category'), 10);
    const eventDate = val('eventDate');
    const location = val('location');

    if (!title || !organizationId || !categoryId || !eventDate || !location) {
        showFieldError('Please fill in all required fields: title, organization, category, date &amp; time and location.');
        return;
    }

    const payload = {
        organization_id: organizationId,
        category_id: categoryId,
        title: title,
        description: val('description') || null,
        event_date: eventDate.replace('T', ' '),
        location: location,
        ticket_price: parseFloat(val('ticketPrice')) || 0,
        target_amount: parseFloat(val('targetAmount')) || 0,
        raised_amount: parseFloat(val('raisedAmount')) || 0,
        status: val('status'),
        image_url: val('imageUrl') || null
    };

    const isEdit = editingId !== null;
    const url = isEdit ? `${API_BASE}/events/${editingId}` : `${API_BASE}/events`;
    const method = isEdit ? 'PUT' : 'POST';

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            showFieldError(data.error || 'Could not save the event. Please check the form and try again.');
            return;
        }

        showMessage(isEdit ? 'Event updated successfully.' : 'Event created successfully.', 'success');
        editingId = null;
        resetForm();
        hideForm();
        loadEvents();
    } catch (error) {
        console.error('Save failed:', error);
        showFieldError('Could not reach the server. Please make sure it is running.');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Update Event' : 'Create Event';
    }
}

async function deleteEvent(id) {
    const ev = eventsCache.find(function (x) { return x.id === id; });
    const title = ev ? ev.title : 'this event';

    if (!window.confirm(`Delete event "${title}"?\n\nThis cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));

        if (res.status === 409) {
            window.alert(data.error || 'Cannot delete this event because it has existing registrations.');
            return;
        }
        if (res.status === 404) {
            showMessage('Event not found. It may have already been deleted.', 'error');
            loadEvents();
            return;
        }
        if (!res.ok) {
            showMessage(data.error || 'Could not delete the event.', 'error');
            return;
        }

        showMessage('Event deleted successfully.', 'success');
        if (editingId === id) {
            editingId = null;
            resetForm();
            hideForm();
        }
        loadEvents();
    } catch (error) {
        console.error('Delete failed:', error);
        showMessage('Could not reach the server. Please make sure it is running.', 'error');
    }
}

function cancelEdit() {
    editingId = null;
    resetForm();
    hideForm();
}

/* ---------------- Form helpers ---------------- */

function showForm() {
    document.getElementById('eventFormCard').style.display = 'block';
}

function hideForm() {
    document.getElementById('eventFormCard').style.display = 'none';
}

function resetForm() {
    document.getElementById('eventForm').reset();
    hideFieldError();
    updateImagePreview();
}

function showFieldError(html) {
    const el = document.getElementById('formError');
    el.innerHTML = html;
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFieldError() {
    document.getElementById('formError').style.display = 'none';
}

function updateImagePreview() {
    const sel = document.getElementById('imageUrl');
    const wrap = document.getElementById('imagePreview');
    const img = document.getElementById('imagePreviewImg');
    if (sel.value) {
        img.src = '../' + sel.value; // admin page lives under /admin/
        wrap.style.display = 'block';
    } else {
        wrap.style.display = 'none';
    }
}

function showMessage(text, type) {
    const el = document.getElementById('adminMessage');
    el.textContent = text;
    el.className = 'admin-message ' + (type === 'success' ? 'success' : 'error');
    el.style.display = 'block';
    clearTimeout(messageTimer);
    if (type === 'success') {
        messageTimer = setTimeout(function () { el.style.display = 'none'; }, 4000);
    }
}

/* ---------------- Small utilities ---------------- */

function val(id) {
    return document.getElementById(id).value.trim();
}

function setVal(id, value) {
    document.getElementById(id).value = (value === null || value === undefined) ? '' : value;
}

function money(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Convert an API date (ISO string) to the value expected by <input type="datetime-local">
function toDatetimeLocalValue(value) {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = function (n) { return String(n).padStart(2, '0'); };
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Human-readable date for the table
function formatEventDate(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value || '';
    return d.toLocaleString('en-AU', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHtml(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
