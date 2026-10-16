# Charity Events Management System

**PROG2002 A3 - Web Development II**

A complete dynamic charity event website with a **client-side site** and an **admin-side site**, built with **MySQL + Node.js + Express (backend API)** and **plain HTML/CSS/JS (frontend)**.

> Constraint: no CSS frameworks, no JS frameworks, no Express template engines (EJS/Pug etc.), no AngularJS.

---

## Features (A3)

### Client-side website
* **Home page (index.html)**: displays all `upcoming` and `ongoing` charity events as cards (category, date, location, organization, ticket price). Click an event to view its details.
* **Search page (search.html)**: filter active events by date, location (fuzzy match) and category, individually or combined.
* **Event detail page (detail.html)**: shows the full event information, the organizing charity, a fundraising progress bar, and the list of tickets purchased (registrations) for the event.
* **Event registration page (registration.html)**: a form that lets a web user register for a selected event and choose how many tickets to purchase.

### Admin-side website (new in A3)
* A dashboard to create, list, update and delete charity events (full CRUD), with deletion blocked when registrations exist.

## Project structure

```
charity-events-A3/
├── server/                    # Backend
│   ├── event_db.js            # MySQL connection pool (mysql2)
│   ├── server.js              # Express server + REST API
│   ├── package.json
│   └── schema.sql             # Database schema + seed data
├── client/                    # Client-side site (static files)
│   ├── index.html
│   ├── search.html
│   ├── detail.html
│   ├── registration.html
│   ├── css/style.css
│   └── js/{common,index,search,detail,registration}.js
├── admin/                     # Admin-side site (static files)
│   ├── admin.html
│   ├── css/
│   └── js/
└── README.md
```

## Database design

Tables:

| Table                   | Purpose                          |
| ----------------------- | -------------------------------- |
| `charity_organizations` | Charity organization information |
| `event_categories`      | Event categories                 |
| `charity_events`        | Charity events (core table)      |
| `registrations`         | Event registrations (tickets purchased by users) |

Relationships: one organization can host many events; one category can contain many events; one event can have many registrations (a user may register for multiple events but only once per event).

## API endpoints

| Method | Path                                           | Description                                       |
| ------ | ---------------------------------------------- | ------------------------------------------------- |
| GET    | `/api/events/upcoming`                         | Homepage: upcoming + ongoing events               |
| GET    | `/api/categories`                              | All categories (search dropdown)                  |
| GET    | `/api/events/search?date=&location=&category=` | Filter events (optional params)                   |
| GET    | `/api/events/:id`                              | Full details of one event + its registrations     |
| POST   | `/api/events`                                  | Admin: create a new event                         |
| PUT    | `/api/events/:id`                              | Admin: update an event                            |
| DELETE | `/api/events/:id`                              | Admin: delete an event (blocked if registrations) |
| POST   | `/api/events/:id/register`                     | Register a user for an event                      |

## Quick start

```
# 1. Create the database (start MySQL first)
mysql -u root -p < server/schema.sql

# 2. Install dependencies
cd server
npm install

# 3. Set your MySQL password
#    Open server/event_db.js and set the password field

# 4. Start the server
node server.js
# Expected output: "Database connected successfully!" and "Server running: http://localhost:3000"

# 5. Open in the browser
#    Home:   http://localhost:3000/
#    Search: http://localhost:3000/search.html
#    Admin:  http://localhost:3000/admin/admin.html
```

## Submission checklist (A3)

* Source code in 3 zip files: `usernameA3-clientside.zip`, `usernameA3-adminside.zip`, `usernameA3-api.zip`
* GitHub repository link (regular commits showing work progress)
* Demo video: max 15 minutes (hosted on SCU OneDrive)
* Peer evaluation form (sent to tutor)
* GenAI usage declaration and academic integrity statement
* Project documentation: ERD, storyboards (wireframes), report

## Author

\[Your name] - \[Student ID]
