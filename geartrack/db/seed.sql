-- MOCK DATA --

INSERT INTO users (username, display_name, role) VALUES
('admin', 'Admin', 'admin'),
('alex', 'Alex', 'user'),
('sam', 'Sam', 'user');

INSERT INTO equipment (name, category, serial, notes, status, condition) VALUES
('Pioneer DDJ-1000', 'Controller', 'SN-DDJ1000-001', 'Main controller', 'available', 'Good'),
('Shure SM58', 'Microphone', 'SN-SM58-122', 'Vocal mic', 'available', 'Excellent'),
('QSC K12.2 Speaker', 'Speaker', 'SN-K12-777', 'Pair speaker (single record)', 'available', 'Good'),
('Chauvet DJ Wash FX', 'Lighting', 'SN-WFX-044', 'Needs careful packing', 'available', 'Fair');