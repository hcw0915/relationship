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
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { ActionMemo } from '../types/database';

export default function MemosScreen() {
  const [memos, setMemos] = useState<ActionMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMemo, setEditingMemo] = useState<ActionMemo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('action_memos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemos(data || []);
    } catch (error) {
      Alert.alert('錯誤', '無法載入備忘錄');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMemo(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setModalVisible(true);
  };

  const openEditModal = (item: ActionMemo) => {
    setEditingMemo(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setPriority(item.priority);
    setDueDate(item.due_date || '');
    setModalVisible(true);
  };

  const saveMemo = async () => {
    if (!title) {
      Alert.alert('提示', '請填寫標題');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const memoData = {
        title,
        description,
        priority,
        due_date: dueDate || null,
        user_id: user.id,
      };

      if (editingMemo) {
        const { error } = await supabase
          .from('action_memos')
          .update(memoData)
          .eq('id', editingMemo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('action_memos')
          .insert([{ ...memoData, status: 'pending' }]);

        if (error) throw error;
      }

      setModalVisible(false);
      loadMemos();
    } catch (error) {
      Alert.alert('錯誤', '無法儲存備忘錄');
    }
  };

  const toggleMemoStatus = async (memo: ActionMemo) => {
    try {
      const newStatus = memo.status === 'pending' ? 'completed' : 'pending';
      const { error } = await supabase
        .from('action_memos')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', memo.id);

      if (error) throw error;
      loadMemos();
    } catch (error) {
      Alert.alert('錯誤', '無法更新狀態');
    }
  };

  const deleteMemo = async (id: string) => {
    Alert.alert('確認刪除', '確定要刪除這個備忘錄嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('action_memos')
              .delete()
              .eq('id', id);

            if (error) throw error;
            loadMemos();
          } catch (error) {
            Alert.alert('錯誤', '無法刪除備忘錄');
          }
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF4444';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '';
    }
  };

  const filteredMemos = memos.filter((memo) => {
    if (filterStatus === 'all') return true;
    return memo.status === filterStatus;
  });

  const renderItem = ({ item }: { item: ActionMemo }) => (
    <View style={styles.memoCard}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => toggleMemoStatus(item)}
      >
        <View style={[
          styles.checkboxInner,
          item.status === 'completed' && styles.checkboxChecked,
        ]}>
          {item.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.memoContent}
        onPress={() => openEditModal(item)}
        onLongPress={() => deleteMemo(item.id)}
      >
        <View style={styles.memoHeader}>
          <Text style={[
            styles.memoTitle,
            item.status === 'completed' && styles.memoTitleCompleted,
          ]}>
            {item.title}
          </Text>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}>
            <Text style={styles.priorityText}>{getPriorityLabel(item.priority)}</Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.memoDescription}>{item.description}</Text>
        )}

        {item.due_date && (
          <Text style={styles.memoDueDate}>截止：{item.due_date}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive,
            ]}>
              {status === 'all' ? '全部' : status === 'pending' ? '待辦' : '已完成'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMemos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? '載入中...' : '還沒有備忘錄，點擊右下角新增'}
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
              {editingMemo ? '編輯備忘錄' : '新增備忘錄'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="標題"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="描述"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>優先級</Text>
            <View style={styles.priorityContainer}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && { backgroundColor: getPriorityColor(p) },
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === p && styles.priorityButtonTextActive,
                  ]}>
                    {getPriorityLabel(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="截止日期 (YYYY-MM-DD) - 選填"
              value={dueDate}
              onChangeText={setDueDate}
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
                onPress={saveMemo}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B9D',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  memoCard: {
    flexDirection: 'row',
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
  checkbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memoContent: {
    flex: 1,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  memoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memoDueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  priorityContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  priorityButtonText: {
    color: '#666',
  },
  priorityButtonTextActive: {
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
