#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>

const int relayPin = 2;
const int LedPin = 4;
#define RESET_PIN 0

String espId = "";
String ssid = "";
String password = "";
const long resetPressTime = 6000;
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;

WebServer server(80);

// ------------------- EEPROM ---------------------
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

void clearWiFiCredentials() {
  Serial.println("🔁 Clearing Wi-Fi credentials...");
  EEPROM.begin(64);
  for (int i = 0; i < 64; i++) EEPROM.write(i, 0);
  EEPROM.commit();
  delay(1000);
  ESP.restart();
}

// ------------------- Web UI ---------------------
String getWebPage() {
  String page = R"rawliteral(
    <!DOCTYPE html>
    <html>
    <head><title>WiFi Setup</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h2 { color: #0066cc; }
      input[type="text"], input[type="password"] {
        width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box;
      }
      input[type="submit"] {
        background-color: #4CAF50; color: white; padding: 12px 20px;
        border: none; border-radius: 4px; cursor: pointer; width: 100%;
      }
      input[type="submit"]:hover { background-color: #45a049; }
      .info { margin-top: 20px; font-size: 14px; color: #555; }
    </style>
    </head><body>
      <h2>Light Config</h2>
      <form action="/save">
        SSID: <input type="text" name="ssid"><br>
        Password: <input type="password" name="password"><br><br>
        <input type="submit" value="Save & Connect">
      </form>
      <div class="info">
        <p><strong>ESP ID:</strong> )rawliteral";
  page += espId;
  page += R"rawliteral(</p>
        <p>Use this ID when adding your device in the app.</p>
      </div>
    </body></html>
  )rawliteral";
  return page;
}

void handleRoot() {
  server.send(200, "text/html", getWebPage());
}

void handleSave() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    ssid = server.arg("ssid");
    password = server.arg("password");
    saveWiFiCredentials(ssid, password);
    server.send(200, "text/html", "✅ Saved! Rebooting...");
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "❌ Missing SSID or password");
  }
}

// ------------------- AP Mode ---------------------
void startAPMode() {
  WiFi.softAP("LIGHT_Config");
  Serial.println("📶 AP Mode Started - connect to 'LIGHT_Config' and go to 192.168.4.1");
  digitalWrite(LedPin, LOW);
  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.begin();
}

// ------------------- Connect to WiFi ---------------------
void connectToWiFi() {
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("🔌 Connecting to Wi-Fi");
  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    digitalWrite(LedPin, HIGH); delay(250);
    digitalWrite(LedPin, LOW); delay(250);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to: " + ssid);
    Serial.println("IP address: " + WiFi.localIP().toString());
    digitalWrite(LedPin, HIGH);
  } else {
    Serial.println("\n⚠️ Failed to connect. Starting AP mode...");
    digitalWrite(LedPin, LOW);
    startAPMode();
  }
}


// ------------------- Register ESP32 on Backend ---------------------
void registerDevice() {
  HTTPClient http;
  String backendURL = "http://192.168.8.141:5000/api/devices/register";  // Your local backend

  http.begin(backendURL);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"espId\":\"" + espId + "\"}";

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("✅ Device registered: " + response);
  } else {
    Serial.print("❌ Failed to register: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ------------------- Relay Control ---------------------
void controlRelay() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://192.168.8.141:5000/api/devices/" + espId;

    http.begin(url);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();
      Serial.println("📨 Device status: " + payload);
      if (payload.indexOf("false") > -1 || payload.indexOf("0") > -1) {
        digitalWrite(relayPin, HIGH); // OFF
      } else {
        digitalWrite(relayPin, LOW);  // ON
      }
    } else {
      Serial.print("❌ HTTP error: ");
      Serial.println(httpCode);
    }
    http.end();
  }
}

// ------------------- Setup ---------------------
void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);
  pinMode(LedPin, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP);
  digitalWrite(relayPin, HIGH);
  digitalWrite(LedPin, LOW);

  espId = "esp_" + String((uint64_t)ESP.getEfuseMac(), HEX);
  Serial.println("🔗 ESP ID: " + espId);

  delay(500);
  if (digitalRead(RESET_PIN) == LOW) {
    Serial.println("BOOT button pressed at startup - resetting WiFi.");
    clearWiFiCredentials();
  }

  loadWiFiCredentials();
  if (ssid != "" && password != "") {
    connectToWiFi();
    registerDevice();  // 👈 Call after WiFi is connected
  } else {
    startAPMode();
  }
}

// ------------------- Loop ---------------------
void loop() {
  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
      Serial.println("BOOT button pressed, hold 6s to reset WiFi");
    } else if ((millis() - buttonPressStartTime) > resetPressTime) {
      Serial.println("Detected long press — resetting WiFi!");
      for (int i = 0; i < 5; i++) {
        digitalWrite(LedPin, HIGH); delay(100);
        digitalWrite(LedPin, LOW); delay(100);
      }
      clearWiFiCredentials();
    }
  } else {
    buttonPressed = false;
  }

  if (WiFi.status() == WL_CONNECTED) {
    controlRelay();
  } else {
    server.handleClient();
    static unsigned long previousMillis = 0;
    static bool ledState = false;
    if (millis() - previousMillis >= 1000) {
      previousMillis = millis();
      ledState = !ledState;
      digitalWrite(LedPin, ledState);
    }
  }

  delay(100);
}
