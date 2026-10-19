// server.js - Express server entry point
//
// PROG2002 A3: RESTful API for the charity events platform.
// Provides endpoints for the client-side site (home/search/detail/register)
// and the admin-side site (full CRUD on charity events).

const express = require('express');
const cors = require('cors');
const db = require('./event_db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the client folder
const path = require('path');
app.use(express.static(path.join(__dirname, '../client')));

/**
 * GET /api/events/upcoming
 * Returns events for the homepage: upcoming + ongoing, sorted by date.
 */
app.get('/api/events/upcoming', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.id, e.title, e.event_date, e.location,
                   e.ticket_price, e.raised_amount, e.target_amount,
                   e.status, e.image_url, e.latitude, e.longitude,
                   o.name AS organization_name,
                   c.name AS category_name,
                   CASE
                       WHEN e.status = 'ongoing' THEN 'ongoing'
                       WHEN e.event_date > NOW() THEN 'upcoming'
                       ELSE 'past'
                   END AS display_status
            FROM charity_events e
            JOIN charity_organizations o ON e.organization_id = o.id
            JOIN event_categories c ON e.category_id = c.id
            WHERE e.status IN ('upcoming', 'ongoing')
              AND (e.event_date >= NOW() OR e.status = 'ongoing')
            ORDER BY e.event_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/events
 * Admin: returns ALL charity events regardless of status
 * (upcoming/ongoing/completed/paused), joined with their organization
 * and category names, sorted by event date.
 */
app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.id, e.title, e.description, e.event_date, e.location,
                   e.ticket_price, e.raised_amount, e.target_amount,
                   e.status, e.image_url, e.latitude, e.longitude,
                   o.id AS organization_id, o.name AS organization_name,
                   c.id AS category_id, c.name AS category_name
            FROM charity_events e
            JOIN charity_organizations o ON e.organization_id = o.id
            JOIN event_categories c ON e.category_id = c.id
            ORDER BY e.event_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Could not load events' });
    }
});

/**
 * GET /api/categories
 * Returns all event categories (used by the search dropdown).
 */
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM event_categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Could not load categories' });
    }
});

/**
 * GET /api/organizations
 * Admin: returns all charity organizations (for the event form dropdown).
 */
app.get('/api/organizations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM charity_organizations ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Could not load organizations' });
    }
});

/**
 * GET /api/events/search?date=YYYY-MM-DD&location=keyword&category=ID
 * Filters active events by optional date / location / category.
 */
app.get('/api/events/search', async (req, res) => {
    try {
        const { date, location, category } = req.query;

        let whereClauses = [];
        let params = [];

        if (date) {
            whereClauses.push('DATE(e.event_date) = ?');
            params.push(date);
        }

        if (location) {
            whereClauses.push('e.location LIKE ?');
            params.push(`%${location}%`);
        }

        if (category) {
            whereClauses.push('e.category_id = ?');
            params.push(category);
        }

        let sql = `
            SELECT e.id, e.title, e.event_date, e.location,
                   e.ticket_price, e.raised_amount, e.target_amount,
                   e.status, e.image_url, e.latitude, e.longitude,
                   o.name AS organization_name,
                   c.name AS category_name,
                   CASE
                       WHEN e.status = 'ongoing' THEN 'ongoing'
                       WHEN e.event_date > NOW() THEN 'upcoming'
                       ELSE 'past'
                   END AS display_status
            FROM charity_events e
            JOIN charity_organizations o ON e.organization_id = o.id
            JOIN event_categories c ON e.category_id = c.id
            WHERE e.status IN ('upcoming', 'ongoing')
        `;

        if (whereClauses.length > 0) {
            sql += ' AND ' + whereClauses.join(' AND ');
        }

        sql += ' ORDER BY e.event_date ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);

    } catch (err) {
        console.error('Search API error:', err);
        res.status(500).json({ error: 'Search failed, please try again' });
    }
});

/**
 * GET /api/events/:id
 * Returns full details of one event together with its complete list of
 * registrations, sorted by the latest registration date first.
 */
app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        const [rows] = await db.query(`
            SELECT e.*,
                   o.name AS organization_name,
                   o.description AS organization_description,
                   o.website AS organization_website,
                   c.name AS category_name
            FROM charity_events e
            JOIN charity_organizations o ON e.organization_id = o.id
            JOIN event_categories c ON e.category_id = c.id
            WHERE e.id = ?
        `, [eventId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Load the registrations for this event (latest first)
        const [regs] = await db.query(`
            SELECT id, full_name, email, phone, tickets_purchased, registration_date
            FROM registrations
            WHERE event_id = ?
            ORDER BY registration_date DESC
        `, [eventId]);

        res.json({ ...rows[0], registrations: regs });

    } catch (err) {
        console.error('Detail API error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/events
 * Admin: creates a new charity event. Required fields are validated before insert.
 */
app.post('/api/events', async (req, res) => {
    try {
        const {
            organization_id, category_id, title, description,
            event_date, location, ticket_price, target_amount,
            raised_amount, status, image_url
        } = req.body;

        // Validate required fields
        if (!organization_id || !category_id || !title || !event_date || !location) {
            return res.status(400).json({
                error: 'Missing required fields: organization_id, category_id, title, event_date, location'
            });
        }

        const [result] = await db.query(`
            INSERT INTO charity_events
                (organization_id, category_id, title, description,
                 event_date, location, ticket_price, target_amount,
                 raised_amount, status, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            organization_id, category_id, title, description || null,
            event_date, location, ticket_price || 0.00, target_amount || 0.00,
            raised_amount || 0.00, status || 'upcoming', image_url || null
        ]);

        res.status(201).json({ id: result.insertId, message: 'Event created successfully' });

    } catch (err) {
        console.error('Create API error:', err);
        res.status(500).json({ error: 'Could not create event' });
    }
});

/**
 * POST /api/events/:id/register
 * Client: registers a user for an event (inserts a registration row).
 * A user (email) may register for the same event only once.
 */
app.post('/api/events/:id/register', async (req, res) => {
    try {
        const eventId = req.params.id;
        const { full_name, email, phone, tickets_purchased } = req.body;

        // Validate required fields
        if (!full_name || !email || !tickets_purchased) {
            return res.status(400).json({
                error: 'Missing required fields: full_name, email, tickets_purchased'
            });
        }

        // Make sure the event exists
        const [event] = await db.query('SELECT id FROM charity_events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [result] = await db.query(`
            INSERT INTO registrations
                (event_id, full_name, email, phone, tickets_purchased)
            VALUES (?, ?, ?, ?, ?)
        `, [eventId, full_name, email, phone || null, tickets_purchased]);

        res.status(201).json({ id: result.insertId, message: 'Registration successful' });

    } catch (err) {
        // Duplicate registration for the same (event_id, email)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'You have already registered for this event' });
        }
        console.error('Register API error:', err);
        res.status(500).json({ error: 'Could not complete registration' });
    }
});

/**
 * PUT /api/events/:id
 * Admin: updates the details of an existing event by its unique id.
 */
app.put('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const {
            organization_id, category_id, title, description,
            event_date, location, ticket_price, target_amount,
            raised_amount, status, image_url
        } = req.body;

        // Validate required fields
        if (!organization_id || !category_id || !title || !event_date || !location) {
            return res.status(400).json({
                error: 'Missing required fields: organization_id, category_id, title, event_date, location'
            });
        }

        const [result] = await db.query(`
            UPDATE charity_events SET
                organization_id = ?, category_id = ?, title = ?, description = ?,
                event_date = ?, location = ?, ticket_price = ?, target_amount = ?,
                raised_amount = ?, status = ?, image_url = ?
            WHERE id = ?
        `, [
            organization_id, category_id, title, description || null,
            event_date, location, ticket_price || 0.00, target_amount || 0.00,
            raised_amount || 0.00, status || 'upcoming', image_url || null,
            eventId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully' });

    } catch (err) {
        console.error('Update API error:', err);
        res.status(500).json({ error: 'Could not update event' });
    }
});

/**
 * DELETE /api/events/:id
 * Admin: removes an event. Deletion is blocked (409) if the event already
 * has any registrations, to preserve data integrity.
 */
app.delete('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        // Check whether the event has any registrations
        const [regs] = await db.query(
            'SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?',
            [eventId]
        );

        if (regs[0].total > 0) {
            return res.status(409).json({
                error: 'Cannot delete this event because it has existing registrations'
            });
        }

        const [result] = await db.query('DELETE FROM charity_events WHERE id = ?', [eventId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });

    } catch (err) {
        console.error('Delete API error:', err);
        res.status(500).json({ error: 'Could not delete event' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Home:  http://localhost:${PORT}/`);
    console.log(`Search: http://localhost:${PORT}/search.html`);
    console.log(`Admin: http://localhost:${PORT}/admin/admin.html`);
});
