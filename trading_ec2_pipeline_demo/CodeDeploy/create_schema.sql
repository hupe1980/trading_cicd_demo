
CREATE TABLE IF NOT EXISTS airport (
ident NVARCHAR(10),
type NVARCHAR(50),
name NVARCHAR(200),
latitude FLOAT,
longitude FLOAT,
elevation_ft FLOAT,
continent NVARCHAR(10),
iso_country NVARCHAR(10),
iso_region NVARCHAR(10),
municipality NVARCHAR(100),
gps_code NVARCHAR(10),
iata_code NVARCHAR(10),
local_code NVARCHAR(10)
);

GRANT SELECT ON airport TO 'web_user'@'%' IDENTIFIED BY 'SED_REPLACE_PASS';

SELECT "WORKED!" as INFO