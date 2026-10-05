"""Constants for HA Homestead."""

DOMAIN = "homestead"

STORAGE_KEY = f"{DOMAIN}.data"
STORAGE_VERSION = 1

SIGNAL_DATA_UPDATED = f"{DOMAIN}_data_updated"

# Options: sensors for the weather recorded on diary events (all optional).
CONF_TEMPERATURE = "temperature_sensor"
CONF_HUMIDITY = "humidity_sensor"
CONF_RAIN = "rain_sensor"
CONF_SOIL = "soil_moisture_sensor"
CONF_OPEN_METEO = "open_meteo"

# Options: phone reminders for planned activities.
CONF_NOTIFY = "notify_services"
CONF_NOTIFY_TIME = "notify_time"
DEFAULT_NOTIFY_TIME = "08:00:00"
