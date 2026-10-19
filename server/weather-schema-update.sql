-- ============================================================
-- Weather API upgrade: add latitude/longitude to charity_events
-- Run this once against the EXISTING deployed database
-- (do NOT re-run schema.sql, it would drop/recreate data).
-- ============================================================

ALTER TABLE charity_events
    ADD COLUMN latitude DECIMAL(9,6) DEFAULT NULL,
    ADD COLUMN longitude DECIMAL(9,6) DEFAULT NULL;

UPDATE charity_events SET latitude=-33.8731, longitude=151.2106 WHERE id=1; -- Annual Charity Gala Dinner 2026
UPDATE charity_events SET latitude=-33.8902, longitude=151.2312 WHERE id=2; -- Green Earth Community Fun Run
UPDATE charity_events SET latitude=-33.8662, longitude=151.1949 WHERE id=3; -- Spring Charity Auction Night
UPDATE charity_events SET latitude=-33.8688, longitude=151.2093 WHERE id=4; -- Children Education Online Fundraiser
UPDATE charity_events SET latitude=-33.8123, longitude=151.0082 WHERE id=5; -- Riverside Clean-up Volunteer Day
UPDATE charity_events SET latitude=-37.8236, longitude=144.9530 WHERE id=6; -- Winter Charity Dinner 2026
UPDATE charity_events SET latitude=-33.8621, longitude=151.2163 WHERE id=7; -- Community Care Walkathon
UPDATE charity_events SET latitude=-33.8915, longitude=151.2774 WHERE id=8; -- Beachside Charity Dinner
UPDATE charity_events SET latitude=-33.8688, longitude=151.2093 WHERE id=9; -- Elderly Care Online Auction
