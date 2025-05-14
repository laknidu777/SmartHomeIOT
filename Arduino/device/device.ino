#include <WiFi.h>
#include <WiFiManager.h>
#include <SocketIoClient.h>
#include <WebSocketsClient.h>
#include <Preferences.h>
#include <ArduinoJson.h>



String espId = "";  // <-- Will be generated from chip ID

const uint8_t RELAY_PIN = 2;     // Signal pin (D2)
const uint8_t LED_PIN = 4;
const uint8_t RESET_PIN = 12;
const unsigned long RESET_PRESS_DURATION = 3000; // Reduced to 3 seconds for reset

Preferences preferences;
String hubSsid = "";
String hubPassword = "";

SocketIoClient backendSocket;
WebSocketsClient hubSocket;

bool isInHubMode = false;
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;

unsigned long lastBlink = 0;
bool ledState = false;


String loadUuidFromPreferences() {
  preferences.begin("uuid", true); // read-only mode
  String uuid = preferences.getString("value", "");
  preferences.end();
  return uuid;
}

void saveUuidToPreferences(const String& uuid) {
  preferences.begin("uuid", false); // write mode
  preferences.putString("value", uuid);
  preferences.end();
  Serial.println("✅ UUID saved to Preferences: " + uuid);
}

void clearUuidFromPreferences() {
  preferences.begin("uuid", false);
  preferences.clear();
  preferences.end();
  Serial.println("🧹 UUID cleared from Preferences");
}


void saveHubCreds(String ssid, String password) {
  preferences.begin("hub", false);
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.end();
  Serial.println("💾 Saved hub credentials");
}

void loadHubCreds() {
  preferences.begin("hub", true);
  hubSsid = preferences.getString("ssid", "");
  hubPassword = preferences.getString("password", "");
  preferences.end();
  Serial.printf("📋 Loaded hub credentials - SSID: %s\n", hubSsid.c_str());
}

void clearAllCredentials() {
  Serial.println("🧹 CLEARING ALL CREDENTIALS!");
  clearUuidFromPreferences();
  // Make sure all LED is solid on for visual feedback
  digitalWrite(LED_PIN, HIGH);
  
  // Clear WiFiManager stored credentials
  WiFi.disconnect(true,true); // true = erase stored credentials
  delay(100);
  esp_wifi_restore();
  delay(100);
  
  // Clear our hub preferences
  preferences.begin("hub", false);
  preferences.clear();
  preferences.end();
  
  // Clear WiFi Manager preferences
  preferences.begin("wifi", false);
  preferences.clear();
  preferences.end();
  
  // Flash LED to indicate success
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, i % 2);
    delay(200);
  }
  
  Serial.println("🔄 All credentials cleared. Rebooting...");
  delay(1000);
  ESP.restart();
}
void checkResetButton() {
  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
      Serial.println("🔘 Reset button press started");
    } else if (millis() - buttonPressStartTime >= 6000) {
      Serial.println("🧹 Performing full Wi-Fi and prefs wipe");

      digitalWrite(LED_PIN, HIGH);  // solid light during wipe

      WiFi.disconnect(true, true);
      delay(100);
      esp_wifi_restore();
      delay(100);

      preferences.begin("wifi", false);
      preferences.clear();
      preferences.end();

      preferences.begin("hub", false); // Optional: in case you store anything else
      preferences.clear();
      preferences.end();

      for (int i = 0; i < 10; i++) {
        digitalWrite(LED_PIN, i % 2);
        delay(200);
      }

      Serial.println("🔁 Rebooting after wipe");
      delay(1000);
      ESP.restart();
    }
  } else {
    if (buttonPressed) {
      Serial.printf("🔘 Button released after %lu ms\n", millis() - buttonPressStartTime);
    }
    buttonPressed = false;
  }
}
// ===== HUB MODE =====
void onHubWsEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      String heartbeat = "HEARTBEAT:" + espId;
      hubSocket.sendTXT(heartbeat);
      Serial.println("❤️ Sent initial heartbeat to Hub: " + heartbeat);
      break;
    }
      
    case WStype_DISCONNECTED:{
      Serial.println("❌ Disconnected from Hub WS");
      break;
    }
    case WStype_TEXT:
      {
        String msg = String((char*)payload);
        Serial.printf("📥 Message from Hub: %s\n", msg.c_str());
        
        // Handle ASSIGN command specifically
        if (msg.startsWith("ASSIGN:")) {
          Serial.println("📦 Received ASSIGN command from hub");
          String creds = msg.substring(7); // Skip "ASSIGN:"
          int comma = creds.indexOf(',');
          
          if (comma != -1) {
            String ssid = creds.substring(0, comma);
            String password = creds.substring(comma + 1);
            ssid.trim(); 
            password.trim();
            
            Serial.printf("🔐 Parsed SSID: %s | Password: %s\n", ssid.c_str(), password.c_str());
            saveHubCreds(ssid, password);
            
            // Confirm receipt before restarting
            hubSocket.sendTXT("ASSIGN_ACK:" + espId);
            Serial.println("✅ Sent acknowledgment to hub");
            
            delay(1000); // let socket process before reset
            ESP.restart();  // reboot to reconnect using new hub credentials
          } else {
            Serial.println("❌ Malformed ASSIGN string – missing comma");
          }
        }
        // Handle COMMAND messages 
        else if (msg.startsWith("COMMAND:")) {
          String command = msg.substring(8); // Remove "COMMAND:"
          int i = command.indexOf(':');

          if (i != -1) {
            String incomingUuid = command.substring(0, i);
            String state = command.substring(i + 1);
            String storedUuid = loadUuidFromPreferences();

            Serial.printf("🧾 UUID check → received: %s | stored: %s\n", incomingUuid.c_str(), storedUuid.c_str());

            if (incomingUuid == storedUuid) {
              digitalWrite(RELAY_PIN, state == "1" ? HIGH : LOW);
              Serial.println("✅ Relay toggled via Hub (UUID match)");
            } else {
              Serial.println("❌ UUID mismatch – ignoring command");
            }
          } else {
            Serial.println("❌ Invalid COMMAND format from Hub");
          }
        }
      }
      break;
  }
}
void connectToHubAP() {
  Serial.printf("🔁 Connecting to Hub AP: %s\n", hubSsid.c_str());
  
  // Clear any existing WiFi connections first
  WiFi.disconnect();
  delay(100);
  
  // Make sure we're in station mode
  WiFi.mode(WIFI_STA);
  delay(100);
  
  // Start the connection attempt with specific credentials
  WiFi.begin(hubSsid.c_str(), hubPassword.c_str());

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    digitalWrite(LED_PIN, tries % 2); // Blink LED during connection attempts
    delay(250);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to Hub AP");
    Serial.printf("📍 IP address: %s\n", WiFi.localIP().toString().c_str());
    isInHubMode = true;

    // Initialize WebSocket connection to hub
    // The default WebSocketsClient port for the hub should be 81
    hubSocket.begin("192.168.4.1", 81, "/");
    hubSocket.onEvent(onHubWsEvent);
    hubSocket.setReconnectInterval(5000); // Reconnect every 5s if connection fails
    
    Serial.println("🔌 WebSocket connection to hub initiated");
  } else {
    Serial.println("\n❌ Failed to connect to Hub AP.");
    // Clear stored hub creds so next reboot tries backend
    preferences.begin("hub", false);
    preferences.clear();
    preferences.end();
    Serial.println("🗑️ Cleared hub credentials due to connection failure");
    delay(1000);
    ESP.restart();
  }
}
// ===== BACKEND MODE =====
void handleBackendEvents() {
  backendSocket.on("connect", [](const char* payload, size_t length) {
    Serial.println("🔌 Connected to Backend WS");
    String json = "{\"espId\":\"" + espId + "\"}";
    backendSocket.emit("registerDevice", json.c_str());
  });
  backendSocket.on("assignUuid", [](const char *payload, size_t length) {
  String raw = String(payload).substring(0, length);
  raw.trim();

  // Handle if it's wrapped like "{\"uuid\":\"...\"}"
  if (raw.startsWith("\"") && raw.endsWith("\"")) {
    raw = raw.substring(1, raw.length() - 1); // remove outer quotes
    raw.replace("\\\"", "\"");                // unescape internal quotes
  }

  DynamicJsonDocument doc(128);
  DeserializationError err = deserializeJson(doc, raw);

  if (!err) {
    String uuid = doc["uuid"];
    Serial.println("📥 Received assignUuid: " + uuid);
    saveUuidToPreferences(uuid);
  } else {
    Serial.println("❌ Failed to parse assignUuid JSON");
  }
});
backendSocket.on("deviceCommand", [](const char *payload, size_t length) {
  String raw = String(payload).substring(0, length);
  raw.trim();

  Serial.printf("📥 Received deviceCommand (raw): %s\n", raw.c_str());

  // ✅ Step 1: Handle non-JSON ASSIGN string
  if (raw.startsWith("ASSIGN:")) {
    Serial.println("📦 Detected ASSIGN command");

    String creds = raw.substring(7); // remove "ASSIGN:"
    int comma = creds.indexOf(',');

    if (comma != -1) {
      String ssid = creds.substring(0, comma);
      String password = creds.substring(comma + 1);
      ssid.trim(); password.trim();

      Serial.printf("🔐 Parsed Hub SSID: %s | Password: %s\n", ssid.c_str(), password.c_str());

      saveHubCreds(ssid, password);
      Serial.printf("💾 Saved SSID = %s | Saved Password = %s\n", ssid.c_str(), password.c_str());
      delay(500);
      ESP.restart();  // reboot to connect to hub
    } else {
      Serial.println("❌ Invalid ASSIGN format (missing comma)");
    }

    return; // ✅ Important: exit early, don't try to parse as JSON
  }

  // ✅ Step 2: If not ASSIGN, treat as JSON
  if (raw.startsWith("\"") && raw.endsWith("\"")) {
    raw = raw.substring(1, raw.length() - 1);  // strip outer quotes
    raw.replace("\\\"", "\"");
    raw.replace("\\\\", "\\");
  }

  Serial.printf("✅ Cleaned JSON string: %s\n", raw.c_str());

  DynamicJsonDocument doc(128);
  DeserializationError err = deserializeJson(doc, raw);

  if (err) {
    Serial.print("❌ JSON Parse Failed: ");
    Serial.println(err.c_str());
    return;
  }

  String cmdUuid = doc["uuid"];
  String command = doc["command"];
  String storedUuid = loadUuidFromPreferences();

  Serial.println("🧾 Stored UUID: " + storedUuid);
  Serial.println("🔑 Received UUID: " + cmdUuid);

  if (cmdUuid == storedUuid) {
    if (command == "1") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("⚡ Relay ON ✅ UUID match");
      backendSocket.emit("message", "\"TOGGLED:1\"");
    } else if (command == "0") {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("⚡ Relay OFF ✅ UUID match");
      backendSocket.emit("message", "\"TOGGLED:0\"");
    } else {
      Serial.printf("❓ Unknown command: %s\n", command.c_str());
    }
  } else {
    Serial.println("🚫 UUID mismatch – command rejected");
  }
});

  backendSocket.on("disconnect", [](const char* payload, size_t length) {
    Serial.println("❌ Disconnected from Backend WS");
  });
}
void setup() {

  String loadedUuid = loadUuidFromPreferences();
  Serial.println("🧾 UUID from Prefereces: " + loadedUuid);

  Serial.begin(115200);
  delay(1000); // Give serial time to connect
  
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP); // This should make button HIGH when not pressed
  
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, HIGH);  // Turn on LED initially
  
  Serial.println("\n\n===============================");
  Serial.println("🚀 ESP32 STARTING UP");
  Serial.println("===============================");

  // ✅ Generate unique ESP ID from chip
  uint64_t chipId = ESP.getEfuseMac();
  char idStr[20];
  snprintf(idStr, sizeof(idStr), "esp_%04X%08X",
           (uint16_t)(chipId >> 32), (uint32_t)chipId);
  espId = String(idStr);
  Serial.println("🆔 Generated ESP ID: " + espId);

  // Check for reset button three times over 3 seconds (debounce)
  int pressedCount = 0;
  Serial.println("🔘 Checking reset button state at startup...");
  
  for (int i = 0; i < 3; i++) {
    int buttonState = digitalRead(RESET_PIN);
    Serial.printf("🔘 Reset button reading %d: %s\n", i, buttonState == LOW ? "PRESSED" : "RELEASED");
    
    if (buttonState == LOW) {
      pressedCount++;
    }
    
    digitalWrite(LED_PIN, i % 2); // Blink LED during check
    delay(150);
  }
  
  // If the button appears to be consistently pressed at startup
  if (pressedCount >= 2) {
    Serial.println("⚠️ Reset button appears to be pressed at startup!");
    Serial.println("🔄 Will perform factory reset now");
    clearAllCredentials(); // This will reboot the ESP
  }
  loadHubCreds();

  if (hubSsid != "") {
    connectToHubAP();
  } else {
    Serial.println("📋 No hub credentials found, connecting to backend Wi-Fi");
    WiFiManager wm;
    
    // Make sure WiFiManager will create its own AP if connection fails
    wm.setConfigPortalTimeout(120); // 2 minutes timeout for config portal
    
    // Add a custom reset parameter to menu
    WiFiManagerParameter custom_reset_button("reset_button", "Reset All Settings", "Reset", 6);
    wm.addParameter(&custom_reset_button);

    bool connected = wm.autoConnect("Device_Setup");
    
    if (connected) {
      Serial.println("✅ Connected to backend Wi-Fi");
      Serial.println("📡 Attempting socket connection to backend..."); 
      backendSocket.begin("192.168.8.141", 5000);
      handleBackendEvents();
    } else {
      Serial.println("❌ Failed to connect to WiFi, will reboot and try again");
      delay(3000);
      ESP.restart();
    }
  }
  
  // Final setup debug info
  Serial.println("🔄 Setup complete, entering main loop");
  Serial.printf("📊 Status: Hub Mode = %s, Connected to %s\n", 
                isInHubMode ? "YES" : "NO", 
                WiFi.SSID().c_str());
}

void loop() {
  checkResetButton();

  // Normal LED blinking (only if not in reset button press)
  if (!buttonPressed && millis() - lastBlink > 1000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  }

  if (isInHubMode) {
    hubSocket.loop();

    static unsigned long last = 0;
    if (millis() - last > 10000) {
      last = millis();
      String uuid = loadUuidFromPreferences();
      String msg = "HEARTBEAT:" + espId + ":" + uuid;
      hubSocket.sendTXT(msg);
      Serial.println("❤️ Sent heartbeat to Hub: " + msg);
    }
  } else {
    backendSocket.loop();

    static unsigned long last = 0;
    if (millis() - last > 10000) {
      last = millis();
      String json = "{\"espId\":\"" + espId + "\"}";
      backendSocket.emit("heartbeat", json.c_str());
      Serial.println("❤️ Sent JSON heartbeat to Backend: " + json);
    }
  }
}