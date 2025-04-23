#include <WiFi.h>
#include <WiFiManager.h>
#include <SocketIoClient.h>
#include <WebSocketsClient.h>
#include <Preferences.h>
#include <HTTPClient.h>

const char* RELAY_ID = "esp3213";
const uint8_t RELAY_PIN = 2;

Preferences preferences;
String hubSsid = "";
String hubPassword = "";

// Clients
SocketIoClient backendSocket;
WebSocketsClient hubSocket;

bool isInHubMode = false;

// Save and Load Hub Credentials
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

// WebSocket to Hub (raw protocol)
void onHubWsEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.println("🔌 Connected to Hub WS");
    hubSocket.sendTXT("HEARTBEAT:" + String(RELAY_ID));
  }
}

void connectToHubAP() {
  Serial.printf("🔁 Connecting to Hub AP: %s\n", hubSsid.c_str());
  WiFi.begin(hubSsid.c_str(), hubPassword.c_str());

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
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

void handleBackendEvents() {
  backendSocket.on("connect", [](const char* payload, size_t length) {
    Serial.println("🔌 Connected to Backend WS");
    backendSocket.emit("registerDevice", "{\"espId\":\"esp3213\"}");
  });

  backendSocket.on("deviceCommand", [](const char *payload, size_t length) {
    String msg = String(payload);
    Serial.printf("📥 Received deviceCommand: %s\n", msg.c_str());

    if (msg.startsWith("ASSIGN:")) {
      int sep = msg.indexOf(",");
      String ssid = msg.substring(7, sep);
      String pw = msg.substring(sep + 1);

      Serial.printf("📦 New Hub Assigned: %s / %s\n", ssid.c_str(), pw.c_str());
      saveHubCreds(ssid, pw);
      delay(1000);
      ESP.restart();
    }
  });
}


void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  loadHubCreds();

  if (hubSsid != "") {
    connectToHubAP();
  } else {
    WiFiManager wm;
    wm.autoConnect("Device_Setup");
    Serial.println("✅ Connected to backend Wi-Fi");

    backendSocket.begin("192.168.8.141", 5000); // Backend IP + port
    handleBackendEvents();
  }
}

void loop() {
  if (isInHubMode) {
    hubSocket.loop();

    static unsigned long last = 0;
    if (millis() - last > 10000) {
      last = millis();
      String msg = "HEARTBEAT:" + String(RELAY_ID);
      hubSocket.sendTXT(msg);
      Serial.println("❤️ Sent heartbeat to Hub: " + msg);
    }

  } else {
    backendSocket.loop();

    static unsigned long last = 0;
    if (millis() - last > 10000) {
      last = millis();
      String json = "{\"espId\":\"" + String(RELAY_ID) + "\"}";
      backendSocket.emit("heartbeat", json.c_str());
      Serial.println("❤️ Sent JSON heartbeat to Backend: " + json);
    }
  }
}
