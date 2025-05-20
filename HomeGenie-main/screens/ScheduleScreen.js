import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform
} from 'react-native';
import api from "../utils/api";
import { DatePickerModal } from 'react-native-paper-dates';
import { TimePickerModal } from 'react-native-paper-dates';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScheduleScreen() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({});
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    getHomeIdAndFetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchDevices();
      fetchSchedules();
    }
  }, [selectedRoomId]);

  const getHomeIdAndFetchRooms = async () => {
    const homeId = await AsyncStorage.getItem('homeId');
    if (homeId) fetchRooms(homeId);
  };

  const fetchRooms = async (homeId) => {
  try {
    const res = await api.get(`/api/rooms/${homeId}`);
    //console.log("✅ Rooms fetched:", res.data);
    setRooms(res.data);
    if (res.data.length > 0) setSelectedRoomId(res.data[0].id);
  } catch (err) {
    //console.error("❌ Failed to fetch rooms:", err?.response?.data || err.message);
    Alert.alert('Error', 'Failed to load rooms');
  }
};


  const fetchDevices = async () => {
    try {
      const res = await api.get(`/api/devices/${selectedRoomId}`);
      setDevices(res.data);
    } catch (err) {
      //console.error("❌ Failed to fetch devices:", err?.response?.data || err.message);
      Alert.alert('Error', 'Failed to load devices');
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/api/schedules/${selectedRoomId}`);
      setSchedules(res.data);
    } catch (err) {
      //console.error("❌ Failed to fetch schedules:", err?.response?.data || err.message);
      Alert.alert('Error', 'Failed to load schedules');
    }
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setForm({});
    setModalVisible(true);
  };

  const openEditModal = (s) => {
    const dt = new Date(s.time);
    setEditingSchedule(s);
    setForm({
      deviceId: s.UserHomeDevice.deviceId,
      action: s.action,
      date: dt,
      time: dt,
      repeat: s.repeat,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/schedules/${id}`);
      fetchSchedules();
    } catch (err) {
      //console.error("❌ Failed to delete schedule:", err?.response?.data || err.message);
      Alert.alert('Error', 'Failed to delete schedule');
    }
  };

  const handleSave = async () => {
  try {
    if (!form.deviceId || !form.date || !form.time || !form.action) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    const dateTime = new Date(
      form.date.getFullYear(),
      form.date.getMonth(),
      form.date.getDate(),
      form.time.getHours(),
      form.time.getMinutes()
    );

    const payload = {
      deviceId: form.deviceId,
      roomId: selectedRoomId,
      action: form.action,
      time: dateTime.toISOString(),
      repeat: form.repeat || 'once',
    };

    console.log("📤 Submitting schedule payload:", payload);

    if (editingSchedule) {
      await api.patch(`/api/schedules/${editingSchedule.id}`, payload);
      Alert.alert("Success", "Schedule updated");
    } else {
      await api.post('/api/schedules', payload);
      Alert.alert("Success", "Schedule added");
    }

    setModalVisible(false);
    fetchSchedules();
  } catch (err) {
    console.error("❌ Failed to save schedule:", err?.response?.data || err.message);
    Alert.alert("Error", err?.response?.data?.message || 'Failed to save schedule');
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedules</Text>

      <Picker
        selectedValue={selectedRoomId}
        onValueChange={(val) => setSelectedRoomId(val)}
        style={styles.picker}
      >
        {rooms.map((room) => (
          <Picker.Item key={room.id} label={room.name} value={room.id} />
        ))}
      </Picker>

      <FlatList
        data={schedules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.scheduleCard}>
            <Text>Device: {item.UserHomeDevice?.Device?.name}</Text>
            <Text>Action: {item.action}</Text>
            <Text>Time: {new Date(item.time).toLocaleString()}</Text>
            <Text>Repeat: {item.repeat}</Text>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => openEditModal(item)} />
              <Button
                title="Delete"
                color="red"
                onPress={() =>
                  Alert.alert('Confirm', 'Delete this schedule?', [
                    { text: 'Cancel' },
                    { text: 'Delete', onPress: () => handleDelete(item.id) },
                  ])
                }
              />
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
          </Text>

          <Text>Device</Text>
          <Picker
            selectedValue={form.deviceId}
            onValueChange={(val) => setForm({ ...form, deviceId: val })}
          >
            {devices.map((d) => (
              <Picker.Item key={d.id} label={d.name} value={d.id} />
            ))}
          </Picker>

          <Text>Action</Text>
          <Picker
            selectedValue={form.action}
            onValueChange={(val) => setForm({ ...form, action: val })}
          >
            <Picker.Item label="On" value="on" />
            <Picker.Item label="Off" value="off" />
          </Picker>

          <Text>Date</Text>
            <Button
            title={form.date ? form.date.toDateString() : 'Select Date'}
            onPress={() => setShowDatePicker(true)}
            />

            <DatePickerModal
            locale="en" // or use your desired locale
            mode="single"
            visible={showDatePicker}
            date={form.date || new Date()}
            onDismiss={() => setShowDatePicker(false)}
            onConfirm={({ date }) => {
                setShowDatePicker(false);
                setForm({ ...form, date });
            }}
            />
            <Text>Time</Text>
            <Button
            title={form.time ? form.time.toLocaleTimeString() : 'Select Time'}
            onPress={() => setShowTimePicker(true)}
            />
          <TimePickerModal
            visible={showTimePicker}
            onDismiss={() => setShowTimePicker(false)}
            onConfirm={({ hours, minutes }) => {
                const newTime = new Date();
                newTime.setHours(hours);
                newTime.setMinutes(minutes);
                setShowTimePicker(false);
                setForm({ ...form, time: newTime });
            }}
            hours={form.time?.getHours() || new Date().getHours()}
            minutes={form.time?.getMinutes() || new Date().getMinutes()}
            />
          <Text>Repeat</Text>
          <Picker
            selectedValue={form.repeat}
            onValueChange={(val) => setForm({ ...form, repeat: val })}
          >
            <Picker.Item label="Once" value="once" />
            <Picker.Item label="Daily" value="daily" />
            <Picker.Item label="Weekly" value="weekly" />
          </Picker>

          <View style={{ marginTop: 16 }}>
            <Button title="Save" onPress={handleSave} />
            <Button title="Cancel" color="gray" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  picker: { marginVertical: 12, backgroundColor: 'white' },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2B6873',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 32, color: 'white' },
  modalContent: {
    marginTop: 80,
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
});
