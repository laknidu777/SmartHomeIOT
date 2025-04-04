#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>

const char* firebaseHost = "https://smart-home-system-9565d-default-rtdb.firebaseio.com/";
const char* firebaseSecret = "AiJDlCwbWOPYDjTtj6eXmoDGWc30B9XO5USQMg3o";

const int relayPin = 2; // GPIO pin for the relay
const int LedPin = 4; // GPIO pin for the relay
WebServer server(80);   // Web server on port 80

String ssid = "";
String password = "";

// Function to save WiFi credentials in EEPROM
void saveWiFiCredentials(String ssid, String password) {
    EEPROM.begin(64);
    for (int i = 0; i < 32; i++) {
        EEPROM.write(i, (i < ssid.length()) ? ssid[i] : 0);
        EEPROM.write(i + 32, (i < password.length()) ? password[i] : 0);
    }
    EEPROM.commit();
}

// Function to load WiFi credentials from EEPROM
void loadWiFiCredentials() {
    EEPROM.begin(64);
    ssid = "";
    password = "";
    for (int i = 0; i < 32; i++) {
        char c = EEPROM.read(i);
        if (c != 0) ssid += c;
        c = EEPROM.read(i + 32);
        if (c != 0) password += c;
    }
}

// Web page for WiFi configuration
String webPage = R"rawliteral(
    <!DOCTYPE html>
    <html>
    <head>
        <title>Door Config</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <h2>Door WiFi Setup</h2>
        <form action="/save">
            SSID: <input type="text" name="ssid"><br>
            Password: <input type="password" name="password"><br>
            <input type="submit" value="Save & Connect">
        </form>
    </body>
    </html>
)rawliteral";

// Handle root webpage
void handleRoot() {
    server.send(200, "text/html", webPage);
}

// Handle saving credentials
void handleSave() {
    if (server.hasArg("ssid") && server.hasArg("password")) {
        ssid = server.arg("ssid");
        password = server.arg("password");

        saveWiFiCredentials(ssid, password);

        server.send(200, "text/html", "WiFi Credentials Saved! Restarting...");
        delay(2000);
        ESP.restart();
    } else {
        server.send(400, "text/plain", "Missing parameters");
    }
}

// Connect to WiFi with stored credentials
void connectToWiFi() {
    WiFi.begin(ssid.c_str(), password.c_str());
    Serial.print("Connecting to WiFi");
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected to WiFi!");
                      digitalWrite (LedPin, HIGH);
    } else {
        Serial.println("\nFailed to connect. Starting AP mode...");
        startAPMode();
        digitalWrite (LedPin, LOW);

    }
}

// Start ESP32 in Access Point mode for WiFi configuration (NO PASSWORD)
void startAPMode() {
    WiFi.softAP("Door_Config");  // Open Access Point (NO PASSWORD)
    Serial.println("AP Mode Started! Connect to 'Door_Config' and go to 192.168.4.1");
    
    server.on("/", handleRoot);
    server.on("/save", handleSave);
    server.begin();
}

// Fetch relay state from Firebase
void controlRelay() {
    if (WiFi.status() == WL_CONNECTED) {
                    digitalWrite (LedPin, HIGH);
        HTTPClient http;
        String url = String(firebaseHost) + "/device/Door1.json?auth=" + firebaseSecret;
        http.begin(url);
        int httpResponseCode = http.GET();

        if (httpResponseCode > 0) {
            String payload = http.getString();
            Serial.print("Received data: ");
            Serial.println(payload);

            if (payload.indexOf("0") > -1) {
                digitalWrite(relayPin, HIGH);  // Relay OFF
                Serial.println("Relay OFF");
            } else {
                digitalWrite(relayPin, LOW);  // Relay ON
                Serial.println("Relay ON");
            }
        } else {
            Serial.print("Error fetching data. HTTP Response code: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
}

void setup() {
    Serial.begin(115200);
    pinMode(relayPin, OUTPUT);
        pinMode(LedPin, OUTPUT);
    digitalWrite(relayPin, HIGH);  // Start relay in OFF state

    loadWiFiCredentials();

    if (ssid != "" && password != "") {
        connectToWiFi();
    } else {
        startAPMode();
    }
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        controlRelay();
    } else {
        server.handleClient();
    }
    delay(100);
}
