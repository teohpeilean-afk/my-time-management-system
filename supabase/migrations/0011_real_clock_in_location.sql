-- Set the real fixed clock-in location, replacing the demo "Shah Alam
-- Factory" seed. Site: 5, Jalan Hi-Tech 6/1, Kawasan Perindustrian Hi-Tech 6,
-- 43500 Semenyih, Selangor. Coordinates are the street-level midpoint of
-- Jalan Hi-Tech 6/1 (OSM), which reverse-geocodes to that street; radius 200 m
-- covers the whole street plus phone-GPS jitter. Updating (not replacing) the
-- row keeps its location_qr_secrets link so the printed QR poster stays valid.
-- HR can fine-tune the exact pin/radius any time on /locations.

update approved_locations
set name = 'Hi-Tech 6 Factory (Semenyih)',
    latitude = 2.9895911,
    longitude = 101.8623049,
    radius_meters = 200,
    active = true
where name = 'Shah Alam Factory';
