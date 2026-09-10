-- Update Suzuki Spare Parts with user uploaded images from /public/Suzuki Spare Parts/

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_56_WATER-PUMP-KIT.jpg',
  '/suzuki-parts/imgi_9_WATER-PUMP-KIT-300x210.jpg',
  '/suzuki-parts/imgi_12_GAS-TIMING-COVER-KIT.jpg',
  '/suzuki-parts/imgi_79_GASKET-.jpg'
]
WHERE name ILIKE '%Water Pump%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_68_Genuine-Subaru-Spark-Plug.jpg',
  '/suzuki-parts/imgi_17_Genuine-Subaru-Spark-Plug-300x300.jpg',
  '/suzuki-parts/imgi_72_Starter.webp',
  '/suzuki-parts/imgi_19_Starter-300x300.webp'
]
WHERE name ILIKE '%Spark Plugs%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_57_TRANSMISSION-FLYWHEEL.jpg',
  '/suzuki-parts/imgi_10_TRANSMISSION-FLYWHEEL-300x210.jpg',
  '/suzuki-parts/imgi_58_STROKER-CRANKSHAFT.jpg',
  '/suzuki-parts/imgi_11_STROKER-CRANKSHAFT-300x210.jpg'
]
WHERE name ILIKE '%Clutch%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_70_Brake-Shoes-Subaru.webp',
  '/suzuki-parts/imgi_18_Brake-Shoes-Subaru-300x300.webp',
  '/suzuki-parts/imgi_28_GASKET--300x210.jpg',
  '/suzuki-parts/imgi_79_GASKET-.jpg'
]
WHERE name ILIKE '%Brake Shoes%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_55_lamps.webp',
  '/suzuki-parts/imgi_38_lamps-300x300.webp',
  '/suzuki-parts/imgi_53_lamps-300x300.webp',
  '/suzuki-parts/imgi_30_4a7130d8thumbnail-300x150.jpg'
]
WHERE name ILIKE '%Headlamp%' OR name ILIKE '%Fog Lamps%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_76_DIFFERENTIAL-COVER.jpg',
  '/suzuki-parts/imgi_25_DIFFERENTIAL-COVER-300x300.jpg',
  '/suzuki-parts/imgi_78_AXLE-COVER.jpg',
  '/suzuki-parts/imgi_27_AXLE-COVER-300x210.jpg'
]
WHERE name ILIKE '%Differential%' OR name ILIKE '%Axle%';

UPDATE parts
SET photos = ARRAY[
  '/suzuki-parts/imgi_33_rear-suspension.webp',
  '/suzuki-parts/imgi_16_rear-suspension.webp',
  '/suzuki-parts/imgi_14_2-19-600x600-1-300x300.jpg',
  '/suzuki-parts/imgi_62_2-19-600x600-1.jpg'
]
WHERE name ILIKE '%Suspension%' OR name ILIKE '%Shock Absorbers%';
