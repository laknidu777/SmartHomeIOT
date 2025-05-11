#include <WiFi.h>
#include <WiFiManager.h>
#include <SocketIoClient.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

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
  if (type == WStype_CONNECTED) {
    Serial.println("🔌 Connected to Hub WS");
    hubSocket.sendTXT("HEARTBEAT:" + espId);
  }
  else if (type == WStype_TEXT) {
  String msg = String((char*)payload);
  Serial.printf("📥 Command from Hub: %s\n", msg.c_str());
  
  if (msg.startsWith("COMMAND:")) {
    Serial.printf("🧪 Raw COMMAND received: %s\n", msg.c_str());

    int firstColon = msg.indexOf(':');
    int secondColon = msg.indexOf(':', firstColon + 1);
    if (firstColon != -1 && secondColon != -1) {
      String targetId = msg.substring(firstColon + 1, secondColon);
      String command = msg.substring(secondColon + 1);
      targetId.trim();
      command.trim();

      Serial.printf("🔍 Parsed target: '%s' | local espId: '%s'\n", targetId.c_str(), espId.c_str());
      Serial.printf("⚙️ Parsed command: '%s' (length: %d)\n", command.c_str(), command.length());

      if (targetId == espId) {
        if (command == "1") {
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("⚡ Relay turned ON");
      } else if (command == "0") {
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("⚡ Relay turned OFF");
      }
 
        else if (command == "reset") {
          Serial.println("🔄 RESET command received and MATCHED - clearing credentials now!");
          // Add a small delay to ensure the response is fully sent
          delay(500);
          clearAllCredentials();  // This should reboot the ESP
        }
        else {
          Serial.printf("❓ Unknown command received: '%s'\n", command.c_str());
        }
      } else {
        Serial.println("🚫 Command target ID does not match this ESP32");
      }
    } else {
      Serial.println("❌ Malformed COMMAND string - couldn't find both colons");
    }
  }
}
}

void connectToHubAP() {
  Serial.printf("🔁 Connecting to Hub AP: %s\n", hubSsid.c_str());
  WiFi.begin(hubSsid.c_str(), hubPassword.c_str());

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    digitalWrite(LED_PIN, LOW);
    delay(250);
    digitalWrite(LED_PIN, HIGH);
    delay(250);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Connected to Hub AP");
    isInHubMode = true;

    hubSocket.begin("192.168.4.1", 81, "/");  
    hubSocket.onEvent(onHubWsEvent);
  } else {
    Serial.println("\n❌ Failed to connect to Hub AP.");
  }
}

// ===== BACKEND MODE =====
void handleBackendEvents() {
  backendSocket.on("connect", [](const char* payload, size_t length) {
    Serial.println("🔌 Connected to Backend WS");
    String json = "{\"espId\":\"" + espId + "\"}";
    backendSocket.emit("registerDevice", json.c_str());
  });

  backendSocket.on("deviceCommand", [](const char *payload, size_t length) {
    String msg = String(payload).substring(0, length);
    Serial.printf("📥 Received deviceCommand: %s\n", msg.c_str());

    if (msg == "1") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("⚡ Relay turned ON (via Backend)");
    } else if (msg == "0") {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("⚡ Relay turned OFF (via Backend)");
    } else if (msg.startsWith("ASSIGN:")) {
      int sep = msg.indexOf(",");
      String ssid = msg.substring(7, sep);
      String pw = msg.substring(sep + 1);
      Serial.printf("📦 Assigned to Hub: %s / %s\n", ssid.c_str(), pw.c_str());

      saveHubCreds(ssid, pw);
      delay(1000);
      ESP.restart();
    } else if (msg == "reset") {
      // Allow remote reset via backend
      clearAllCredentials();
    }
  });
  backendSocket.on("disconnect", [](const char* payload, size_t length) {
  Serial.println("❌ Disconnected from Backend WS");
}); 

}

void setup() {
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
      String msg = "HEARTBEAT:" + espId;
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