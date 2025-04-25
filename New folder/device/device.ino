#include <WiFi.h>
#include <WiFiManager.h>
#include <SocketIoClient.h>
#include <WebSocketsClient.h>
#include <Preferences.h>

String espId = "";  // <-- Will be generated from chip ID

const uint8_t RELAY_PIN = 2;     // Signal pin (D2)
const uint8_t LED_PIN = 4;
const uint8_t RESET_PIN = 0;

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
}

void loadHubCreds() {
  preferences.begin("hub", true);
  hubSsid = preferences.getString("ssid", "");
  hubPassword = preferences.getString("password", "");
  preferences.end();
}

void checkResetButton() {
  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
    } else if (millis() - buttonPressStartTime >= 6000) {
      preferences.begin("hub", false);
      preferences.clear();
      preferences.end();
      Serial.println("🔄 Hub credentials cleared. Rebooting...");
      delay(1000);
      ESP.restart();
    }
  } else {
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

    if (msg == "COMMAND:on") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("⚡ Relay turned ON (via Hub)");
    } else if (msg == "COMMAND:off") {
      digitalWrite(RELAY_PIN, LOW);
      Serial.println("⚡ Relay turned OFF (via Hub)");
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

    if (msg == "on") {
      digitalWrite(RELAY_PIN, HIGH);
      Serial.println("⚡ Relay turned ON (via Backend)");
    } else if (msg == "off") {
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
    }
  });
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP);
  digitalWrite(RELAY_PIN, LOW);

  // ✅ Generate unique ESP ID from chip
  uint64_t chipId = ESP.getEfuseMac();
  char idStr[20];
  snprintf(idStr, sizeof(idStr), "esp_%04X%08X",
           (uint16_t)(chipId >> 32), (uint32_t)chipId);
  espId = String(idStr);
  Serial.println("🆔 Generated ESP ID: " + espId);

  loadHubCreds();

  if (hubSsid != "") {
    connectToHubAP();
  } else {
    WiFiManager wm;
    wm.autoConnect("Device_Setup");
    Serial.println("✅ Connected to backend Wi-Fi");

    backendSocket.begin("192.168.8.141", 5000);
    handleBackendEvents();
  }
}

void loop() {
  checkResetButton();

  if (millis() - lastBlink > 1000) {
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
