-- Enrich parts with multiple high-resolution photos per item

-- 1. Body Panels: 4 photos (Main profile, primer texture, mounting clips, genuine parts box)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Body Panels';

-- 2. Engine & Drivetrain: 4 photos (Component overview, machined tolerances, ECSTAR packaging, exploded diagram)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Engine & Drivetrain';

-- 3. Electrical & Lighting: 4 photos (Illuminated lens, waterproof pin socket, Denso OEM label, night projection)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Electrical & Lighting';

-- 4. Suspension & Steering: 4 photos (Dampers/springs, high-tensile bushings, zinc anti-corrosion, vehicle stance)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Suspension & Steering';

-- 5. Brakes & Wheels: 4 photos (Ventilated rotor face, ceramic pad compound, steel wheel rim, hub fitment)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Brakes & Wheels';

-- 6. Interior & Accessories: 4 photos (3D molded tray, textured non-skid back, mounting crossbars, cabin fitting)
UPDATE parts
SET photos = ARRAY[
  photos[1],
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
]
WHERE category = 'Interior & Accessories';

-- Custom specific photo sets for flagship parts:
-- Jimny Snorkel Body Kit
UPDATE parts
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80'
]
WHERE name ILIKE '%snorkel%';

-- Swift Sport Roof Spoiler Wing
UPDATE parts
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80'
]
WHERE name ILIKE '%spoiler%';
