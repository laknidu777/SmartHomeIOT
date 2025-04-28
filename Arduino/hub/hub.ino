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
const int RESET_PIN = 0;
unsigned long buttonPressStartTime = 0;
bool buttonPressed = false;

unsigned long lastBlink = 0;
bool ledState = false;

bool hubRegistered = false;

struct Device {
  String id;
  unsigned long lastHeartbeat;
  bool reportedOffline = false;
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

void notifyBackendOffline(String espId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "http://192.168.8.141:5000/api/devices/" + espId + "/offline";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST("");
    Serial.printf("📡 Notified backend: %s → HTTP %d\n", espId.c_str(), httpCode);
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

void setupWiFi() {
  preferences.begin("wifi", true);
  String ssid = preferences.getString("ssid", "");
  String password = preferences.getString("password", "");
  preferences.end();

  WiFi.mode(WIFI_AP_STA);
  IPAddress local_ip(192,168,4,1);
  WiFi.softAPConfig(local_ip, local_ip, IPAddress(255,255,255,0));
  WiFi.softAP(ap_ssid, ap_password);
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
          dev.reportedOffline = false;
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
    }
  }
}

void backendSocketEvent(socketIOmessageType_t type, uint8_t * payload, size_t length) {
  switch(type) {
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
      Serial.printf("📥 Raw event: %s\n", (char*)payload);
      String msg = String((char*)payload);
      Serial.print("📥 Event from backend: ");
      Serial.println(msg);
      if (msg.indexOf("hubToggleCommand") != -1) {
        Serial.println("✅ Matched hubToggleCommand");

        DynamicJsonDocument doc(256);
        DeserializationError error = deserializeJson(doc, msg);

        if (error) {
          Serial.print(F("❌ deserializeJson() failed: "));
          Serial.println(error.f_str());
          return;
        }

        if (doc[0] == "hubToggleCommand") {
          String espId = doc[1][0].as<String>();
          String command = doc[1][1].as<String>();

          String wsCommand = "COMMAND:" + espId + ":" + command;
          Serial.printf("📤 Sending command via WS: %s\n", wsCommand.c_str());
          webSocket.broadcastTXT(wsCommand);
        }
      }



      else if (msg.indexOf("hubAssignCommand") != -1) {
        Serial.println("✅ Matched hubAssignCommand");

        int dataStart = msg.indexOf(",") + 1;
        String jsonData = msg.substring(dataStart, msg.length() - 1);

        int sep = jsonData.indexOf(",");
        String espId = jsonData.substring(0, sep);
        String credentials = jsonData.substring(sep + 1); // Should be ssid,password

        String wsCommand = "ASSIGN:" + credentials;

        for (auto& dev : connectedDevices) {
          if (dev.id == espId) {
            webSocket.broadcastTXT(wsCommand);
            Serial.printf("📤 Relayed ASSIGN to %s: %s\n", espId.c_str(), wsCommand.c_str());
            break;
          }
        }
      }
      else if (msg.indexOf("hubResetCommand") != -1) {
  Serial.println("✅ Matched hubResetCommand");

  // Step 1: Find the outer [ of the inner array
  int arrayStart = msg.indexOf(",[");
  int quoteStart = msg.indexOf("\"", arrayStart);
  int quoteEnd = msg.indexOf("\"", quoteStart + 1);

  if (quoteStart != -1 && quoteEnd != -1 && quoteEnd > quoteStart) {
    String deviceId = msg.substring(quoteStart + 1, quoteEnd);
    deviceId.trim();

    Serial.printf("🎯 Target device for reset: '%s'\n", deviceId.c_str());

    String wsCommand = "COMMAND:" + deviceId + ":reset";
    Serial.printf("📤 Preparing reset command: '%s'\n", wsCommand.c_str());

    bool deviceFound = false;
    for (auto& dev : connectedDevices) {
      if (dev.id == deviceId) {
        deviceFound = true;
        webSocket.broadcastTXT(wsCommand);
        Serial.printf("📤 Successfully sent RESET to device '%s'\n", deviceId.c_str());
        break;
      }
    }

    if (!deviceFound) {
      Serial.printf("⚠️ Cannot send reset - device '%s' not in connected list\n", deviceId.c_str());
    }
  } else {
    Serial.println("❌ Failed to extract espId from hubResetCommand");
  }
}

      break;
    }
    case sIOtype_DISCONNECT: {
      Serial.println("❌ Disconnected from backend");
      hubRegistered = false; // allow re-registration next time
      break;
    }
  }
}

void setupBackendSocket() {
  backendSocket.begin("192.168.8.141", 5000, "/socket.io/?EIO=3"); // 🔧 Switched from EIO=4 to EIO=3
  backendSocket.onEvent(backendSocketEvent);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP);
  setupWiFi();
  webSocket.begin();
  webSocket.onEvent(handleWebSocket);
  Serial.println("🔌 WebSocket Server started (port 81)");
  Serial.println("🧩 Connected devices:");
    for (auto& dev : connectedDevices) {
      Serial.println(" - " + dev.id);
    }


  setupBackendSocket();
}

void loop() {
  webSocket.loop();
  backendSocket.loop();
  checkResetButton();

  if (millis() - lastBlink > 1000) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  }

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
