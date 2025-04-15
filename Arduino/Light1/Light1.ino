#include <WiFi.h>
#include <WiFiClient.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <SocketIoClient.h>

SocketIoClient socket;
WebServer server(80);

// --- Pins ---
const int relayPin = 2;
const int LedPin = 4;
#define RESET_PIN 0

// --- Credentials ---
String espId = "";
String espSecret = "";
String ssid = "";
String password = "";

// --- Flags ---
bool socketConnected = false;
const long resetPressTime = 6000;
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;

// --- Heartbeat ---
unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 30000; // 30 sec

// ---------------- EEPROM ----------------
void saveWiFiCredentials(String ssid, String password, String secret) {
  EEPROM.begin(128);
  for (int i = 0; i < 32; i++) {
    EEPROM.write(i, (i < ssid.length()) ? ssid[i] : 0);
    EEPROM.write(i + 32, (i < password.length()) ? password[i] : 0);
    EEPROM.write(i + 64, (i < secret.length()) ? secret[i] : 0);
  }
  EEPROM.commit();
}

void loadWiFiCredentials() {
  EEPROM.begin(128);
  ssid = ""; password = ""; espSecret = "";
  for (int i = 0; i < 32; i++) {
    char c = EEPROM.read(i);
    if (c != 0) ssid += c;
    c = EEPROM.read(i + 32);
    if (c != 0) password += c;
    c = EEPROM.read(i + 64);
    if (c != 0) espSecret += c;
  }
}

void clearWiFiCredentials() {
  Serial.println("🔁 Clearing Wi-Fi credentials and espSecret...");
  EEPROM.begin(128);
  for (int i = 0; i < 96; i++) EEPROM.write(i, 0);
  EEPROM.commit();
  delay(1000);
  ESP.restart();
}

// ---------------- Web UI ----------------
String getWebPage() {
  String page = R"rawliteral(
    <!DOCTYPE html>
    <html>
    <head><title>WiFi Setup</title><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial; margin: 20px; }
      input[type="text"], input[type="password"] {
        width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box;
      }
      input[type="submit"] {
        background-color: #4CAF50; color: white; padding: 12px;
        border: none; border-radius: 4px; cursor: pointer; width: 100%;
      }
      .info { margin-top: 20px; font-size: 14px; color: #555; }
    </style>
    </head><body>
      <h2>Device Configuration</h2>
      <form action="/save">
        SSID: <input type="text" name="ssid"><br>
        Password: <input type="password" name="password"><br>
        ESP Secret: <input type="text" name="espSecret"><br><br>
        <input type="submit" value="Save & Connect">
      </form>
      <div class="info">
        <p><strong>ESP ID:</strong> )rawliteral";
  page += espId;
  page += R"rawliteral(</p>
        <p>Paste this ESP ID in your mobile app while adding a device.</p>
      </div>
    </body></html>
  )rawliteral";
  return page;
}

void handleRoot() {
  server.send(200, "text/html", getWebPage());
}

void handleSave() {
  if (server.hasArg("ssid") && server.hasArg("password") && server.hasArg("espSecret")) {
    ssid = server.arg("ssid");
    password = server.arg("password");
    espSecret = server.arg("espSecret");
    saveWiFiCredentials(ssid, password, espSecret);
    server.send(200, "text/html", "✅ Saved! Rebooting...");
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "❌ Missing required fields");
  }
}

// ---------------- WebSocket ----------------
void handleDeviceCommand(const char* payload, size_t length) {
  String command = String(payload).substring(0, length);
  Serial.println("📥 Command received: " + command);

  if (command == "on") {
    digitalWrite(relayPin, LOW);  // ON
  } else if (command == "off") {
    digitalWrite(relayPin, HIGH); // OFF
  }
}

void connectToSocket() {
  socket.on("connect", [](const char *payload, size_t length) {
    Serial.println("✅ [WebSocket] connected — re-registering device");
    socketConnected = true;

    String json = "{\"espId\":\"" + espId + "\"}";
    socket.emit("registerDevice", json.c_str());
    Serial.println("📡 registerDevice emitted");
  });

  socket.on("disconnect", [](const char *payload, size_t length) {
    Serial.println("💥 [WebSocket] disconnected");
    socketConnected = false;
  });

  socket.on("deviceCommand", handleDeviceCommand);
  socket.begin("192.168.8.141", 5000);  // Replace with your backend IP and port
  Serial.println("🔌 [WebSocket] attempting connection...");
}

void checkWebSocketConnection() {
  static unsigned long lastReconnectAttempt = 0;

  if (WiFi.status() == WL_CONNECTED && !socketConnected && millis() - lastReconnectAttempt > 10000) {
    lastReconnectAttempt = millis();
    Serial.println("📡 WebSocket reconnection attempt...");

    socket.disconnect();  // Clean any dangling connections
    connectToSocket();    // Reconnect once
  }
}


// ---------------- WiFi ----------------
void startAPMode() {
  WiFi.softAP("LIGHT_Config");
  Serial.println("📶 AP Mode Started - Connect to 'LIGHT_Config' and go to 192.168.4.1");
  digitalWrite(LedPin, LOW);
  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.begin();
}

void connectToWiFi() {
  WiFi.begin(ssid.c_str(), password.c_str());
  WiFi.setAutoReconnect(true);
  WiFi.persistent(true);
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
    connectToSocket();
  } else {
    Serial.println("\n⚠️ Failed to connect. Starting AP mode...");
    digitalWrite(LedPin, LOW);
    startAPMode();
  }
}

// ---------------- Setup ----------------
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
  } else {
    startAPMode();
  }
}

// ---------------- Loop ----------------
void loop() {
  socket.loop();
  checkWebSocketConnection();

  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
      Serial.println("BOOT button pressed, hold 6s to reset WiFi");
    } else if ((millis() - buttonPressStartTime) > resetPressTime) {
      Serial.println("Detected long press — resetting WiFi + espSecret");
      for (int i = 0; i < 5; i++) {
        digitalWrite(LedPin, HIGH); delay(100);
        digitalWrite(LedPin, LOW); delay(100);
      }
      clearWiFiCredentials();
    }
  } else {
    buttonPressed = false;
  }

  // Heartbeat every 30 seconds
  if (WiFi.status() == WL_CONNECTED && millis() - lastHeartbeatTime > heartbeatInterval) {
    lastHeartbeatTime = millis();
    String json = "{\"espId\":\"" + espId + "\"}";
    socket.emit("heartbeat", json.c_str());
    Serial.println("📡 Sent heartbeat");
  }

  // LED blink when connected
  static unsigned long previousMillis = 0;
  static int blinkStep = 0;

  if (WiFi.status() == WL_CONNECTED) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= 100) {
      previousMillis = currentMillis;
      blinkStep++;
      if (blinkStep == 1 || blinkStep == 3) digitalWrite(LedPin, HIGH);
      else if (blinkStep == 2 || blinkStep == 4) digitalWrite(LedPin, LOW);
      else if (blinkStep >= 10) blinkStep = 0;
    }
  } else {
    server.handleClient();
    if (millis() - previousMillis >= 1000) {
      previousMillis = millis();
      digitalWrite(LedPin, !digitalRead(LedPin));
    }
  }

  delay(10);
}
