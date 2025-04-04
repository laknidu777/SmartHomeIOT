#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>

const char* firebaseHost = "https://smart-home-system-9565d-default-rtdb.firebaseio.com/";
const char* firebaseSecret = "AiJDlCwbWOPYDjTtj6eXmoDGWc30B9XO5USQMg3o";
const int emgSensorPin = 36; // GPIO pin for the EMG sensor (A0)
const int LedPin = 4; // GPIO pin for the relay
WebServer server(80);        // Web server on port 80

String ssid = "";
String password = "";

void saveWiFiCredentials(String ssid, String password) {
    EEPROM.begin(64);
    for (int i = 0; i < 32; i++) {
        EEPROM.write(i, (i < ssid.length()) ? ssid[i] : 0);
        EEPROM.write(i + 32, (i < password.length()) ? password[i] : 0);
    }
    EEPROM.commit();
}

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

String webPage = R"rawliteral(
    <!DOCTYPE html>
    <html>
    <head>
        <title>EMG WIFI Config</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <h2>EMG WiFi Setup</h2>
        <form action="/save">
            SSID: <input type="text" name="ssid"><br>
            Password: <input type="password" name="password"><br>
            <input type="submit" value="Save & Connect">
        </form>
    </body>
    </html>
)rawliteral";

void handleRoot() {
    server.send(200, "text/html", webPage);
}

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

void startAPMode() {
    WiFi.softAP("EMG_Config");
    Serial.println("AP Mode Started! Connect to 'EMG_Config' and go to 192.168.4.1");

    server.on("/", handleRoot);
    server.on("/save", handleSave);
    server.begin();
}

void sendEMGData() {
    if (WiFi.status() == WL_CONNECTED) {
                    digitalWrite (LedPin, HIGH);
        int emgValue = analogRead(emgSensorPin);
        int firebaseValue = (emgValue > 1) ? 1 : 0;

        Serial.print("EMG Sensor Value: ");
        Serial.println(emgValue);
        Serial.print("Sending to Firebase: ");
        Serial.println(firebaseValue);

        HTTPClient http;
        String url = String(firebaseHost) + "/emgSensorData.json?auth=" + firebaseSecret;
        http.begin(url);
        http.addHeader("Content-Type", "application/json");

        String jsonData = "{\"value\":" + String(firebaseValue) + "}";
        int httpResponseCode = http.PUT(jsonData);
        http.end();

        if (httpResponseCode > 0) {
            Serial.print("Data sent to Firebase. Response code: ");
            Serial.println(httpResponseCode);
        } else {
            Serial.print("Error sending data. HTTP Response code: ");
            Serial.println(httpResponseCode);
        }
    }
}

void setup() {
    Serial.begin(115200);
        pinMode(LedPin, OUTPUT);
    pinMode(emgSensorPin, INPUT);

    loadWiFiCredentials();

    if (ssid != "" && password != "") {
        connectToWiFi();
    } else {
        startAPMode();
    }
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        sendEMGData();
    } else {
        server.handleClient();
    }
    delay(100);
}