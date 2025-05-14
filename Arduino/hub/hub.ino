#include <WiFi.h>
#include <esp_wifi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <WebSocketsServer.h>
#include <SocketIOclient.h>
#include <vector>
#include <HTTPClient.h>
#include <ArduinoJson.h>

Preferences preferences;
WebServer server(80);
WebSocketsServer webSocket = WebSocketsServer(81);
SocketIOclient backendSocket;

const char* ap_ssid = "CentralHub-Setup";
const char* ap_password = "12345678";
String hubId = "hub_" + String((uint32_t)ESP.getEfuseMac(), HEX);

const int LED_PIN = 4;
const int RESET_PIN = 12; // ✅ Changed to GPIO 12 (D12)
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;

unsigned long lastBlink = 0;
bool ledState = false;

bool hubRegistered = false;
struct Device {
  String id;
  String uuid;
  unsigned long lastHeartbeat;
  bool reportedOffline;
  uint8_t clientId;

  Device(String _id, String _uuid, unsigned long _hb, bool _offline, uint8_t _cid)
    : id(_id), uuid(_uuid), lastHeartbeat(_hb), reportedOffline(_offline), clientId(_cid) {}
};


std::vector<Device> connectedDevices;

String htmlForm = R"rawliteral(
<!DOCTYPE html>
<html><head><title>Hub Wi-Fi Setup</title>
<style>body{font-family:Arial;text-align:center;padding:50px;}input{padding:10px;margin:10px;width:200px;}button{padding:10px 20px;}</style></head>
<body><h2>Configure Hub Wi-Fi</h2>
<form action="/save" method="POST">
<input type="text" name="ssid" placeholder="WiFi SSID" required><br>
<input type="password" name="password" placeholder="Password" required><br>
<button type="submit">Save and Reboot</button>
</form></body></html>
)rawliteral";

void notifyBackendOffline(String uuid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://192.168.8.141:5000/api/devices/" + uuid + "/offline";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST("");
    Serial.printf("📡 Notified backend: %s → HTTP %d\n", uuid.c_str(), httpCode);
    http.end();
  } else {
    Serial.println("❌ Cannot notify backend — no Wi-Fi.");
  }
}
void notifyBackendAssignment(String uuid) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://192.168.8.141:5000/api/devices/" + uuid + "/assigned";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST("{\"connected\":true}");
    Serial.printf("📡 Notified backend of assignment: HTTP %d\n", httpCode);
    http.end();
  } else {
    Serial.println("❌ Cannot notify backend — no Wi-Fi.");
  }
}

void checkResetButton() {
  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStartTime = millis();
    } else if (millis() - buttonPressStartTime >= 6000) {
      preferences.begin("wifi", false);
      preferences.clear();
      clearStoredDevices(); // also clear connected devices
      preferences.end();
      Serial.println("🔄 WiFi credentials cleared. Rebooting...");
      delay(1000);
      ESP.restart();
    }
  } else {
    buttonPressed = false;
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
void handleDevicePage() {
  String html = "<!DOCTYPE html><html><head><title>Hub Device Control</title>";
  html += "<style>body{font-family:sans-serif;padding:30px;}table{border-collapse:collapse;width:100%;}th,td{padding:10px;border:1px solid #ccc;text-align:left;}button{padding:5px 10px;}</style>";
  html += "</head><body><h2>Connected Devices</h2>";
  html += "<table><tr><th>espId</th><th>UUID</th><th>Actions</th></tr>";

  for (const Device& dev : connectedDevices) {
    html += "<tr>";
    html += "<td>" + dev.id + "</td>";
    html += "<td>" + dev.uuid + "</td>";
    html += "<td>";
    html += "<a href=\"/toggle?uuid=" + dev.uuid + "&state=1\"><button>ON</button></a> ";
    html += "<a href=\"/toggle?uuid=" + dev.uuid + "&state=0\"><button>OFF</button></a>";
    html += "</td>";
    html += "</tr>";
  }

  html += "</table></body></html>";
  server.send(200, "text/html", html);
}
void handleToggle() {
  if (!server.hasArg("uuid") || !server.hasArg("state")) {
    server.send(400, "text/plain", "Missing uuid or state");
    return;
  }

  String uuid = server.arg("uuid");
  String state = server.arg("state");

  for (const Device& dev : connectedDevices) {
    if (dev.uuid == uuid) {
      String cmd = "COMMAND:" + uuid + ":" + state;
      webSocket.sendTXT(dev.clientId, cmd);
      Serial.printf("⚡ Toggled %s → %s\n", uuid.c_str(), state.c_str());
      server.send(200, "text/plain", "Toggled device " + uuid + " to state " + state);
      return;
    }
  }

  server.send(404, "text/plain", "Device not found");
}

void setupWiFi() {
  preferences.begin("wifi", true);
  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");
  preferences.end();

  WiFi.mode(WIFI_AP_STA);
  IPAddress local_ip(192, 168, 4, 1);
  WiFi.softAPConfig(local_ip, local_ip, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ap_ssid, ap_password);
  delay(100);
  Serial.println("📡 Hub AP started: CentralHub-Setup (192.168.4.1)");

  if (ssid != "") {
    WiFi.begin(ssid.c_str(), password.c_str());
    Serial.print("🌐 Connecting to home Wi-Fi");

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      Serial.print(".");
      delay(500);
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ Connected to Home Wi-Fi!");
      Serial.print("IP: "); Serial.println(WiFi.localIP());
    } else {
      Serial.println("\n❌ Failed to connect. Running in AP-only mode.");
    }
  } else {
    Serial.println("⚠️ No Wi-Fi credentials. Visit / to configure.");
  }

  // ✅ Register routes always
  server.on("/", handleRoot);
  server.on("/save", handleSave);
  server.on("/devices", handleDevicePage);
  server.on("/toggle", handleToggle);
  server.begin();
  Serial.println("🌐 Web server started");
}
void handleWebSocket(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("🔌 Client #%u disconnected\n", num);
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("🔌 Client #%u connected from %d.%d.%d.%d\n", num, ip[0], ip[1], ip[2], ip[3]);
      break;
    }

    case WStype_TEXT: {
      String msg = String((char*)payload);
      Serial.printf("📩 Received from client #%u: %s\n", num, msg.c_str());

      // Handle HEARTBEAT
      if (msg.startsWith("HEARTBEAT:")) {
        int sep1 = msg.indexOf(':');
        int sep2 = msg.indexOf(':', sep1 + 1);

        String espId = msg.substring(sep1 + 1, sep2);
        String uuid = msg.substring(sep2 + 1);
        espId.trim();
        uuid.trim();

        Serial.printf("❤️ Received HEARTBEAT from %s (uuid: %s)\n", espId.c_str(), uuid.c_str());

        bool found = false;
        for (auto& dev : connectedDevices) {
          if (dev.id == espId) {
            dev.lastHeartbeat = millis();
            dev.clientId = num;
            dev.uuid = uuid;

            if (dev.reportedOffline) {
              dev.reportedOffline = false;
              notifyBackendAssignment(uuid); // Device came back online
            }

            Serial.printf("🔁 Updated device %s with client #%u\n", espId.c_str(), num);
            found = true;
            break;
          }
        }

        if (!found) {
          connectedDevices.push_back({espId, uuid, millis(), false, num});
          Serial.printf("🆕 New device: %s (client #%u)\n", espId.c_str(), num);
          saveDeviceToMemory(espId);
          notifyBackendAssignment(uuid);  // New device seen for first time
        }
      }

      // Handle TOGGLE COMMAND from backend
      else if (msg.startsWith("COMMAND:")) {
  // Format: COMMAND:<uuid>:<state>
  String cmd = msg.substring(8); // strip "COMMAND:"
  int splitIdx = cmd.indexOf(':');

  String uuid = cmd.substring(0, splitIdx);
  String state = cmd.substring(splitIdx + 1);

  // Find the espId that matches this UUID in connectedDevices
  String targetEspId = "";
uint8_t targetClientId = 255;

for (const Device& dev : connectedDevices) {
  if (dev.uuid == uuid) {
    targetEspId = dev.id;
    targetClientId = dev.clientId;
    break;
  }
}


  if (targetEspId != "" && targetClientId != 255) {
    String relayCommand = "COMMAND:" + uuid + ":" + state;
    webSocket.sendTXT(targetClientId, relayCommand);
    Serial.println("📡 Relayed to " + targetEspId + " → " + relayCommand);
  } else {
    Serial.println("❌ UUID not found in connectedDevices");
  }
}

      break;
    }
  }
}
void backendSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case sIOtype_CONNECT: {
      Serial.println("🔌 Connected to backend socket.io");
      if (!hubRegistered) {
        String msg = "[\"registerHub\", {\"hubId\":\"" + hubId + "\"}]";
        backendSocket.sendEVENT(msg);
        hubRegistered = true;
        Serial.println("✅ Hub registered with backend");
      }
      break;
    }

    case sIOtype_EVENT: {
      String msg = String((char*)payload);
      Serial.printf("📥 Backend Event: %s\n", msg.c_str());
      // ✅ Add this below existing message parsing
      if (msg.indexOf("message") != -1 && msg.indexOf("COMMAND:") != -1) {
        Serial.println("🧩 Detected COMMAND message with UUID");

        int cmdStart = msg.indexOf("COMMAND:");
        if (cmdStart == -1) return;

        String cmd = msg.substring(cmdStart);
        int endQuote = cmd.indexOf("\"");
        if (endQuote != -1) cmd = cmd.substring(0, endQuote);

        Serial.println("🧾 Parsed CMD from backend: " + cmd);

        // Format: COMMAND:uuid:state
        int sep = cmd.indexOf(':', 8);
        if (sep == -1) {
          Serial.println("❌ Invalid format");
          return;
        }

        String uuid = cmd.substring(8, sep);
        String state = cmd.substring(sep + 1);

        // Find the correct client
        for (const Device& dev : connectedDevices) {
          if (dev.uuid == uuid) {
            String relay = "COMMAND:" + uuid + ":" + state;
            webSocket.sendTXT(dev.clientId, relay);
            Serial.printf("📡 Relayed COMMAND to %s (client #%d): %s\n",
              dev.id.c_str(), dev.clientId, relay.c_str());
            return;
          }
        }

        Serial.println("❌ UUID not found among connected devices.");
      }

      // New parsing approach for all messages
      else if (msg.indexOf("message") != -1 && msg.indexOf("ASSIGN:") != -1) {
        Serial.println("📦 Detected ASSIGN command from backend");
        
        // Extract the full ASSIGN command
        int assignPos = msg.indexOf("ASSIGN:");
        if (assignPos == -1) break;
        
        String assignCmd = msg.substring(assignPos);
        // Find end of the command (before closing quote/bracket)
        int cmdEnd = assignCmd.indexOf("\"");
        if (cmdEnd != -1) {
          assignCmd = assignCmd.substring(0, cmdEnd);
        }
        
        Serial.printf("🧩 Extracted command: %s\n", assignCmd.c_str());
        
        // Format: ASSIGN:espId:ssid,password
        int firstColon = assignCmd.indexOf(':');
        int secondColon = assignCmd.indexOf(':', firstColon + 1);
        
        if (firstColon != -1 && secondColon != -1) {
          String targetId = assignCmd.substring(firstColon + 1, secondColon);
          String credentials = assignCmd.substring(secondColon + 1);
          
          Serial.printf("🎯 Target device: %s\n", targetId.c_str());
          Serial.printf("🔐 Credentials: %s\n", credentials.c_str());
          
          // Reformatted command for device - just ASSIGN:ssid,password
          String wsCommand = "ASSIGN:" + credentials;
          
          // Find target device in connected list
          bool deviceFound = false;
          for (auto& dev : connectedDevices) {
            if (dev.id == targetId) {
              deviceFound = true;
              webSocket.sendTXT(dev.clientId, wsCommand);
              Serial.printf("📤 ASSIGN sent to device %s (client #%d): %s\n", 
                         targetId.c_str(), dev.clientId, wsCommand.c_str());
              break;
            }
          }
          
          if (!deviceFound) {
            Serial.printf("⚠️ Target device %s not found in connected devices\n", targetId.c_str());
            // Try broadcasting as fallback
            webSocket.broadcastTXT(wsCommand);
            Serial.println("📢 Broadcasting ASSIGN command to all devices");
          }
        }
      }
      // Original handlers for TOGGLE/RESET commands
      else if (msg.indexOf("hubToggleCommand") != -1) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, msg);
        if (error) {
          Serial.print(F("❌ Failed to parse hubToggleCommand: "));
          Serial.println(error.f_str());
          return;
        }

        String espId = doc[1][0].as<String>();
        String command = doc[1][1].as<String>();
        String wsCommand = "COMMAND:" + espId + ":" + command;
        webSocket.broadcastTXT(wsCommand);
        Serial.printf("📤 TOGGLE → %s\n", wsCommand.c_str());
      }
      else if (msg.indexOf("hubResetCommand") != -1) {
        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, msg);
        if (error) {
          Serial.print(F("❌ Failed to parse hubResetCommand: "));
          Serial.println(error.f_str());
          return;
        }

        String espId = doc[1][0].as<String>();
        String wsCommand = "COMMAND:" + espId + ":reset";
        webSocket.broadcastTXT(wsCommand);
        Serial.printf("📤 RESET → %s\n", wsCommand.c_str());
      }
      break;
    }
    case sIOtype_DISCONNECT: {
      Serial.println("❌ Disconnected from backend");
      hubRegistered = false;
      break;
    }
  }
}
void setupBackendSocket() {
  backendSocket.begin("192.168.8.141", 5000, "/socket.io/?EIO=3"); // Match backend version
  backendSocket.onEvent(backendSocketEvent);
}
void saveDeviceToMemory(String espId) {
  preferences.begin("hubDevices", false);
  int count = preferences.getUInt("count", 0);

  for (int i = 0; i < count; i++) {
    String key = "d" + String(i);
    String stored = preferences.getString(key.c_str(), "");
    if (stored == espId) {
      preferences.end(); // Already exists
      return;
    }
  }

  String newKey = "d" + String(count);
  preferences.putString(newKey.c_str(), espId);
  preferences.putUInt("count", count + 1);
  preferences.end();
  Serial.printf("💾 Device %s saved to flash\n", espId.c_str());
}


// 🧠 Load devices stored in flash on boot
void loadStoredDevices() {
  preferences.begin("hubDevices", true);
  int count = preferences.getUInt("count", 0);

  for (int i = 0; i < count; i++) {
    String key = "d" + String(i);
    String espId = preferences.getString(key.c_str(), "");
    if (espId != "") {
      // Initialize with clientId = 0, will be updated when device connects
      connectedDevices.push_back({espId, "", 0, true, 0});
      Serial.printf("🔁 Restored device from flash: %s\n", espId.c_str());
    }
  }
  preferences.end();
}
// 🧹 Clear all stored device memory (for reset mode)
void clearStoredDevices() {
  preferences.begin("hubDevices", false);
  preferences.clear();
  preferences.end();
  Serial.println("🧹 Cleared all stored device memory.");
}
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP);

  setupWiFi();
  webSocket.begin();
  webSocket.onEvent(handleWebSocket);
  Serial.println("🔌 WebSocket Server started (port 81)");
  loadStoredDevices();
  setupBackendSocket();
  // server.on("/devices", handleDevicePage);
  // server.on("/toggle", handleToggle);

}

void loop() {
  webSocket.loop();
  backendSocket.loop();
  server.handleClient(); 
  checkResetButton();

  // Show connected device count every 10 seconds
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 10000) {
    lastPrint = millis();
    int connected = WiFi.softAPgetStationNum();
    Serial.printf("📶 Devices connected to AP: %d\n", connected);
  }
  // Blink LED if not connected
  if (WiFi.status() != WL_CONNECTED && millis() - lastBlink > 500) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  } else if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, HIGH); // Solid on when connected
  }

  // Check for offline devices
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 5000) {
    lastCheck = millis();
    for (auto& dev : connectedDevices) {
      if ((millis() - dev.lastHeartbeat > 65000) && !dev.reportedOffline) {
        Serial.printf("❌ Device %s is offline\n", dev.id.c_str());
        notifyBackendOffline(dev.uuid);
        dev.reportedOffline = true;
      }
    }
  }
}
