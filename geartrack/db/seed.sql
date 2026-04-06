-- MOCK DATA --
-- Default seeded password for all accounts: geartrack123

INSERT INTO users (username, display_name, role, password_hash) VALUES
('admin', 'Admin', 'admin', '__HASH__'),
('alex', 'Alex', 'user', '__HASH__'),
('sam', 'Sam', 'user', '__HASH__');

INSERT INTO equipment (name, category, serial, notes, status, condition) VALUES
('Pioneer DDJ-1000', 'Controller', 'SN-DDJ1000-001', 'Main controller', 'available', 'Good'),
('Shure SM58', 'Microphone', 'SN-SM58-122', 'Vocal mic', 'available', 'Excellent'),
('QSC K12.2 Speaker', 'Speaker', 'SN-K12-777', 'Pair speaker (single record)', 'available', 'Good'),
('Chauvet DJ Wash FX', 'Lighting', 'SN-WFX-044', 'Needs careful packing', 'available', 'Fair');
