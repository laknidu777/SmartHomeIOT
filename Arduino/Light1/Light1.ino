#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <EEPROM.h>

const char* firebaseHost = "https://smart-home-system-9565d-default-rtdb.firebaseio.com/";
const char* firebaseSecret = "AiJDlCwbWOPYDjTtj6eXmoDGWc30B9XO5USQMg3o";

const int relayPin = 2;       // GPIO controlling the relay
const int LedPin = 4;         // GPIO indicating Wi-Fi status
#define RESET_PIN 0           // BOOT button (GPIO 0 for reset)

// Button press timing variables
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;
const long resetPressTime = 6000; // 6 seconds for reset

WebServer server(80);
String ssid = "";
String password = "";

// ------------------- EEPROM Utilities ---------------------
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
String webPage = R"rawliteral(
  <!DOCTYPE html>
  <html>
  <head>
    <title>WiFi Setup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h2 { color: #0066cc; }
      input[type="text"], input[type="password"] { 
        width: 100%; 
        padding: 10px; 
        margin: 8px 0; 
        box-sizing: border-box; 
      }
      input[type="submit"] {
        background-color: #4CAF50;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
      }
      input[type="submit"]:hover {
        background-color: #45a049;
      }
    </style>
  </head>
  <body>
    <h2>Light Config</h2>
    <form action="/save">
      SSID: <input type="text" name="ssid"><br>
      Password: <input type="password" name="password"><br><br>
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

// ------------------- Wi-Fi Connect ---------------------
void connectToWiFi() {
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("🔌 Connecting to Wi-Fi");
  int attempts = 0;
  
  // Blink LED while trying to connect
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    digitalWrite(LedPin, HIGH);
    delay(250);
    digitalWrite(LedPin, LOW);
    delay(250);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to: " + String(ssid));
    Serial.println("IP address: " + WiFi.localIP().toString());
    digitalWrite(LedPin, HIGH);  // Solid ON when connected
  } else {
    Serial.println("\n⚠️ Failed to connect. Starting AP mode...");
    digitalWrite(LedPin, LOW);
    startAPMode();
  }
}

// ------------------- Firebase ---------------------
void controlRelay() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(firebaseHost) + "/device/Light1.json?auth=" + firebaseSecret;
    http.begin(url);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.println("📨 Firebase data: " + payload);
      if (payload.indexOf("0") > -1) {
        digitalWrite(relayPin, HIGH); // OFF
      } else {
        digitalWrite(relayPin, LOW);  // ON
      }
    } else {
      Serial.print("❌ HTTP error: ");
      Serial.println(httpResponseCode);
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
  digitalWrite(relayPin, HIGH); // default OFF
  digitalWrite(LedPin, LOW);    // default LED off

  Serial.println("\n\n----- ESP32 Light Controller Starting -----");
  
  // Check if BOOT button is held at startup
  delay(500);
  if (digitalRead(RESET_PIN) == LOW) {
    Serial.println("BOOT button pressed during startup - clearing WiFi credentials");
    clearWiFiCredentials();  // Hold BOOT button during startup
  }

  loadWiFiCredentials();
  if (ssid != "" && password != "") {
    Serial.println("Found saved credentials for: " + ssid);
    connectToWiFi();
  } else {
    Serial.println("No WiFi credentials found");
    startAPMode();
  }
}

// ------------------- Loop ---------------------
void loop() {
  // Monitor BOOT button for long press during operation
  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
      Serial.println("BOOT button pressed, hold for 6 seconds to reset WiFi");
    } else {
      // Check if button has been pressed long enough
      if ((millis() - buttonPressStartTime) > resetPressTime) {
        Serial.println("Long press detected! Clearing WiFi credentials...");
        // Visual feedback for reset
        for (int i = 0; i < 5; i++) {
          digitalWrite(LedPin, HIGH);
          delay(100);
          digitalWrite(LedPin, LOW);
          delay(100);
        }
        clearWiFiCredentials();
        // No need to restart here as clearWiFiCredentials() already does that
      }
    }
  } else {
    buttonPressed = false; // Reset when button is released
  }

  // Regular operation
  if (WiFi.status() == WL_CONNECTED) {
    controlRelay();
  } else {
    // If in AP mode, handle clients and blink LED slowly
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