-- ============================================================
-- PROG2002 A2: Charity Events Database Schema
-- Database name: charityevents_db
-- ============================================================

-- Create the database if it does not already exist
CREATE DATABASE IF NOT EXISTS charityevents_db;
USE charityevents_db;

-- ============================================================
-- Table 1: charity_organizations
-- ============================================================
CREATE TABLE charity_organizations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    website     VARCHAR(300),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table 2: event_categories
-- ============================================================
CREATE TABLE event_categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500)
);

-- ============================================================
-- Table 3: charity_events (core table)
-- ============================================================
CREATE TABLE charity_events (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    category_id     INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    event_date      DATETIME NOT NULL,          -- event start time
    location        VARCHAR(300) NOT NULL,      -- event location
    ticket_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- ticket price
    target_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- fundraising goal
    raised_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- amount raised
    status          ENUM('upcoming','ongoing','completed','paused') NOT NULL DEFAULT 'upcoming',
    image_url       VARCHAR(500),               -- event image
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- foreign keys
    FOREIGN KEY (organization_id)
        REFERENCES charity_organizations(id)
        ON DELETE CASCADE,
    FOREIGN KEY (category_id)
        REFERENCES event_categories(id)
        ON DELETE CASCADE
);

-- ============================================================
-- Seed data: charity organizations (at least 2)
-- ============================================================
INSERT INTO charity_organizations (name, description, website) VALUES
('Hope Foundation',
 'Hope Foundation is a non-profit organization dedicated to improving education and healthcare for children in rural communities across Australia.',
 'https://hopefoundation.org.au'),
('Green Earth Charity',
 'Green Earth Charity focuses on environmental conservation, tree planting, and sustainable living initiatives.',
 'https://greenearth.org.au'),
('Community Care Network',
 'Community Care Network supports elderly and vulnerable members of society through food programs and home visits.',
 'https://communitycare.org.au');

-- ============================================================
-- Seed data: event categories (at least 3)
-- ============================================================
INSERT INTO event_categories (name, description) VALUES
('Charity Dinner', 'Formal dinner events to raise funds for charitable causes'),
('Fun Run', 'Community running/walking events that collect donations per kilometre'),
('Charity Auction', 'Silent or live auctions of donated goods and experiences'),
('Volunteer Day', 'Hands-on volunteering opportunities for the community'),
('Online Fundraiser', 'Virtual fundraising events held online');

-- ============================================================
-- Seed data: charity events (at least 8)
-- Status guide:
--   upcoming = future date (shown on homepage)
--   ongoing  = currently active (shown on homepage)
--   completed= past date (hidden from homepage, searchable)
--   paused   = suspended (hidden from homepage)
-- Reference date: 2026-10-03
-- ============================================================
INSERT INTO charity_events
(organization_id, category_id, title, description, event_date, location,
 ticket_price, target_amount, raised_amount, status, image_url) VALUES

-- Event 1: upcoming (homepage)
(1, 1, 'Annual Charity Gala Dinner 2026',
 'Join us for an elegant evening of fine dining, live entertainment, and inspiring stories as we raise funds to build schools in rural Australia. Black tie optional.',
 '2026-11-15 18:30:00', 'Sydney Convention Centre, Sydney NSW',
 150.00, 50000.00, 12500.00, 'upcoming', 'images/dinner1.jpg'),

-- Event 2: upcoming (homepage)
(2, 2, 'Green Earth Community Fun Run',
 'A 5km fun run through Centennial Park. Every entrant receives a t-shirt and medal. All proceeds go towards our reforestation projects.',
 '2026-10-25 07:00:00', 'Centennial Park, Sydney NSW',
 35.00, 20000.00, 8200.00, 'upcoming', 'images/run1.jpg'),

-- Event 3: upcoming (homepage)
(3, 3, 'Spring Charity Auction Night',
 'Bid on premium artworks, luxury getaways, and dining experiences. 100% of auction proceeds support our food delivery program for the elderly.',
 '2026-11-08 19:00:00', 'The Star Event Centre, Sydney NSW',
 80.00, 30000.00, 5000.00, 'upcoming', 'images/auction1.jpg'),

-- Event 4: ongoing (homepage)
(1, 5, 'Children Education Online Fundraiser',
 'A month-long online fundraising campaign. Donate directly and watch the progress tracker update in real time. Every dollar helps provide textbooks and scholarships.',
 '2026-10-01 00:00:00', 'Online (Australia-wide)',
 10.00, 25000.00, 15800.00, 'ongoing', 'images/online1.jpg'),

-- Event 5: upcoming (homepage)
(2, 4, 'Riverside Clean-up Volunteer Day',
 'Spend a morning helping clean up the Parramatta River. Gloves and bags provided. Morning tea included. Suitable for families and groups.',
 '2026-10-18 09:00:00', 'Parramatta Park, Parramatta NSW',
 0.00, 5000.00, 1200.00, 'upcoming', 'images/volunteer1.jpg'),

-- Event 6: completed (hidden from homepage, searchable)
(1, 1, 'Winter Charity Dinner 2026',
 'Thank you to everyone who attended our Winter Charity Dinner. We raised $18,500 for children''s education programs.',
 '2026-07-20 18:30:00', 'Melbourne Convention Centre, Melbourne VIC',
 120.00, 40000.00, 18500.00, 'completed', NULL),

-- Event 7: completed (hidden from homepage, searchable)
(3, 2, 'Community Care Walkathon',
 'A successful 10km walkathon with over 500 participants. Thank you to all our sponsors and volunteers.',
 '2026-08-30 08:00:00', 'Royal Botanic Garden, Sydney NSW',
 25.00, 15000.00, 16200.00, 'completed', NULL),

-- Event 8: paused (hidden from homepage)
(2, 1, 'Beachside Charity Dinner',
 'This event has been postponed due to unforeseen weather concerns. We will announce a new date shortly.',
 '2026-10-20 18:00:00', 'Bondi Pavilion, Sydney NSW',
 95.00, 18000.00, 2000.00, 'paused', NULL),

-- Event 9: upcoming (homepage)
(3, 5, 'Elderly Care Online Auction',
 'An online silent auction featuring homemade crafts, garden produce, and services donated by local businesses. All funds support our home-visit program.',
 '2026-11-01 00:00:00', 'Online (NSW region)',
 5.00, 10000.00, 3400.00, 'upcoming', 'images/online2.jpg');
