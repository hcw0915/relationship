import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { ImportantDate } from '../types/database';

export default function DatesScreen() {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'birthday' | 'anniversary' | 'other'>('other');
  const [notes, setNotes] = useState('');
  const [reminderDays, setReminderDays] = useState('7');

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('important_dates')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setDates(data || []);
    } catch (error) {
      Alert.alert('錯誤', '無法載入日期');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDate(null);
    setTitle('');
    setDate('');
    setType('other');
    setNotes('');
    setReminderDays('7');
    setModalVisible(true);
  };

  const openEditModal = (item: ImportantDate) => {
    setEditingDate(item);
    setTitle(item.title);
    setDate(item.date);
    setType(item.type);
    setNotes(item.notes || '');
    setReminderDays(item.reminder_days_before.toString());
    setModalVisible(true);
  };

  const saveDate = async () => {
    if (!title || !date) {
      Alert.alert('提示', '請填寫標題和日期');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateData = {
        title,
        date,
        type,
        notes,
        reminder_days_before: parseInt(reminderDays) || 7,
        user_id: user.id,
      };

      if (editingDate) {
        const { error } = await supabase
          .from('important_dates')
          .update(dateData)
          .eq('id', editingDate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('important_dates')
          .insert([dateData]);

        if (error) throw error;
      }

      setModalVisible(false);
      loadDates();
    } catch (error) {
      Alert.alert('錯誤', '無法儲存日期');
    }
  };

  const deleteDate = async (id: string) => {
    Alert.alert('確認刪除', '確定要刪除這個日期嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('important_dates')
              .delete()
              .eq('id', id);

            if (error) throw error;
            loadDates();
          } catch (error) {
            Alert.alert('錯誤', '無法刪除日期');
          }
        },
      },
    ]);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'birthday': return '生日';
      case 'anniversary': return '紀念日';
      default: return '其他';
    }
  };

  const renderItem = ({ item }: { item: ImportantDate }) => (
    <TouchableOpacity
      style={styles.dateCard}
      onPress={() => openEditModal(item)}
      onLongPress={() => deleteDate(item.id)}
    >
      <View style={styles.dateHeader}>
        <Text style={styles.dateTitle}>{item.title}</Text>
        <Text style={styles.dateType}>{getTypeLabel(item.type)}</Text>
      </View>
      <Text style={styles.dateDate}>{item.date}</Text>
      {item.notes && <Text style={styles.dateNotes}>{item.notes}</Text>}
      <Text style={styles.dateReminder}>提前 {item.reminder_days_before} 天提醒</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? '載入中...' : '還沒有重要日期，點擊右下角新增'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDate ? '編輯日期' : '新增日期'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="標題"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="日期 (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
            />

            <View style={styles.typeContainer}>
              {(['birthday', 'anniversary', 'other'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeButton, type === t && styles.typeButtonActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                    {getTypeLabel(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="提前幾天提醒"
              value={reminderDays}
              onChangeText={setReminderDays}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="備註"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveDate}
              >
                <Text style={styles.buttonText}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  dateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  dateType: {
    fontSize: 12,
    color: '#FF6B9D',
    backgroundColor: '#FFE8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  dateNotes: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  dateReminder: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B9D',
    borderColor: '#FF6B9D',
  },
  typeButtonText: {
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
