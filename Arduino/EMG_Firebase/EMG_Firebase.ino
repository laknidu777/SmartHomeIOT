#include <WiFi.h>
#include <SocketIoClient.h>

const char* ssid = "Laknidu";
const char* password = "hslc6923";

// EMG setup
const int emgPin = 34;  // Analog input pin
const int threshold = 500;  // Set based on real readings
unsigned long lastTriggerTime = 0;
const int debounce = 2000; // 2s cooldown between toggles

// Socket
SocketIoClient socket;
const char* espId = "esp_8435653b015c"; // Match with DB
const char* deviceId = "1"; // Use real deviceId

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected to WiFi");

  // Connect to backend WebSocket
  socket.begin("192.168.8.100", 3000);  // <-- replace with your IP/PORT
  //socket.setReconnectInterval(5000);
}

void loop() {
  socket.loop();

  int emgValue = analogRead(emgPin);
  Serial.print("EMG Value: ");
  Serial.println(emgValue);

  // Flex detected
  if (emgValue > threshold && millis() - lastTriggerTime > debounce) {
    String payload = String("{\"espId\":\"") + espId + "\",\"deviceId\":\"" + deviceId + "\"}";
    socket.emit("emgToggle", payload.c_str());
    Serial.println("🧠 EMG flex detected → emgToggle emitted!");
    lastTriggerTime = millis();
  }

  delay(50); // Smooth out the reads
}
