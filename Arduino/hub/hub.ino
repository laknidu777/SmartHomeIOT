#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <WebSocketsServer.h>
#include <vector>
#include <HTTPClient.h>

Preferences preferences;
WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);

const char* ap_ssid = "CentralHub-Setup";
const char* ap_password = "12345678";

struct Device {
  String id;
  unsigned long lastHeartbeat;
  bool reportedOffline = false;  // NEW: to prevent multiple notifications
};
std::vector<Device> connectedDevices;

// HTML Wi-Fi Config Form
String htmlForm = R"rawliteral(
  <form action="/save" method="POST">
    SSID: <input type="text" name="ssid"><br>
    Password: <input type="password" name="password"><br>
    <input type="submit" value="Save and Reboot">
  </form>
)rawliteral";

void notifyBackendOffline(String espId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://192.168.8.141:5000/api/devices/" + espId + "/offline";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST("");  // Send empty body
    Serial.printf("📡 Notified backend: %s → HTTP %d\n", espId.c_str(), httpCode);
    http.end();
  } else {
    Serial.println("❌ Cannot notify backend — no Wi-Fi.");
  }
}

void handleRoot() {
  server.send(200, "text/html", htmlForm);
}

void handleSave() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");

  preferences.begin("wifi", false);
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.end();

  server.send(200, "text/plain", "✅ Saved! Rebooting...");
  delay(1500);
  ESP.restart();
}

void setupWiFi() {
  preferences.begin("wifi", true);
  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");
  preferences.end();

  WiFi.mode(WIFI_AP_STA);
  IPAddress local_ip(192,168,4,1);
  IPAddress gateway(192,168,4,1);
  IPAddress subnet(255,255,255,0);
  WiFi.softAPConfig(local_ip, gateway, subnet);
  WiFi.softAP(ap_ssid, ap_password);
  Serial.println("📡 Hub AP started: CentralHub-Setup (192.168.4.1)");

  if (ssid != "") {
    WiFi.begin(ssid.c_str(), password.c_str());
    Serial.print("🌐 Connecting to home Wi-Fi");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Connected to Home Wi-Fi!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\n❌ Failed to connect. Running in AP-only mode.");
    }
  } else {
    Serial.println("⚠️ No Wi-Fi credentials. Visit / to configure.");
    server.on("/", handleRoot);
    server.on("/save", handleSave);
    server.begin();
    while (true) {
      server.handleClient();
      delay(10);
    }
  }
}

void handleWebSocket(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_TEXT) {
    String msg = String((char*)payload);

    if (msg.startsWith("HEARTBEAT:")) {
      String deviceId = msg.substring(10);
      bool found = false;
      for (auto& dev : connectedDevices) {
        if (dev.id == deviceId) {
          dev.lastHeartbeat = millis();
          dev.reportedOffline = false; // Mark it back online
          found = true;
          break;
        }
      }
      if (!found) {
        connectedDevices.push_back({deviceId, millis(), false});
        Serial.printf("🆕 New device: %s\n", deviceId.c_str());
      } else {
        Serial.printf("🔁 Heartbeat updated: %s\n", deviceId.c_str());
      }
    } else if (msg.startsWith("TOGGLE:")) {
      Serial.printf("🔁 Toggle Command: %s\n", msg.c_str());
    }
  }
}

void setup() {
  Serial.begin(115200);
  setupWiFi();

  webSocket.begin();
  webSocket.onEvent(handleWebSocket);
  Serial.println("🔌 WebSocket Server started (port 81)");
}

void loop() {
  webSocket.loop();

  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    for (auto& dev : connectedDevices) {
      if ((millis() - dev.lastHeartbeat > 65000) && !dev.reportedOffline) {
        Serial.printf("❌ Device %s is offline\n", dev.id.c_str());
        notifyBackendOffline(dev.id);
        dev.reportedOffline = true;
      }
    }
  }
}
