// server.js - Express server entry point

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

// GET /api/events/upcoming - events for the homepage (upcoming + ongoing)
app.get('/api/events/upcoming', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.id, e.title, e.event_date, e.location,
                   e.ticket_price, e.raised_amount, e.target_amount,
                   e.status, e.image_url,
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

// GET /api/categories - all event categories (for the search dropdown)
app.get('/api/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name FROM event_categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('API error:', err);
        res.status(500).json({ error: 'Could not load categories' });
    }
});

// GET /api/events/search?date=YYYY-MM-DD&location=keyword&category=ID
// All query parameters are optional; each one filters the results.
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
                   e.status, e.image_url,
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

// GET /api/events/:id - full details for a single event
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

        res.json(rows[0]);

    } catch (err) {
        console.error('Detail API error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Home:  http://localhost:${PORT}/`);
    console.log(`Search: http://localhost:${PORT}/search.html`);
});
