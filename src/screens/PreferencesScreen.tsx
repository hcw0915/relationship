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
import type { PartnerPreference } from '../types/database';

const CATEGORIES = [
  '喜好',
  '厭惡',
  '過敏',
  '飲食',
  '興趣',
  '習慣',
  '其他',
];

export default function PreferencesScreen() {
  const [preferences, setPreferences] = useState<PartnerPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPreference, setEditingPreference] = useState<PartnerPreference | null>(null);
  const [category, setCategory] = useState('喜好');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreferences(data || []);
    } catch (error) {
      Alert.alert('錯誤', '無法載入偏好');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingPreference(null);
    setCategory('喜好');
    setTitle('');
    setDescription('');
    setTagsInput('');
    setModalVisible(true);
  };

  const openEditModal = (item: PartnerPreference) => {
    setEditingPreference(item);
    setCategory(item.category);
    setTitle(item.title);
    setDescription(item.description || '');
    setTagsInput(item.tags?.join(', ') || '');
    setModalVisible(true);
  };

  const savePreference = async () => {
    if (!title) {
      Alert.alert('提示', '請填寫標題');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const preferenceData = {
        category,
        title,
        description,
        tags: tags.length > 0 ? tags : null,
        user_id: user.id,
      };

      if (editingPreference) {
        const { error } = await supabase
          .from('partner_preferences')
          .update(preferenceData)
          .eq('id', editingPreference.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partner_preferences')
          .insert([preferenceData]);

        if (error) throw error;
      }

      setModalVisible(false);
      loadPreferences();
    } catch (error) {
      Alert.alert('錯誤', '無法儲存偏好');
    }
  };

  const deletePreference = async (id: string) => {
    Alert.alert('確認刪除', '確定要刪除這個偏好嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('partner_preferences')
              .delete()
              .eq('id', id);

            if (error) throw error;
            loadPreferences();
          } catch (error) {
            Alert.alert('錯誤', '無法刪除偏好');
          }
        },
      },
    ]);
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      '喜好': '#4CAF50',
      '厭惡': '#FF4444',
      '過敏': '#FF9800',
      '飲食': '#2196F3',
      '興趣': '#9C27B0',
      '習慣': '#00BCD4',
      '其他': '#999',
    };
    return colors[cat] || '#999';
  };

  const filteredPreferences = selectedCategory
    ? preferences.filter((p) => p.category === selectedCategory)
    : preferences;

  const renderItem = ({ item }: { item: PartnerPreference }) => (
    <TouchableOpacity
      style={styles.preferenceCard}
      onPress={() => openEditModal(item)}
      onLongPress={() => deletePreference(item.id)}
    >
      <View style={styles.preferenceHeader}>
        <Text style={styles.preferenceTitle}>{item.title}</Text>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: getCategoryColor(item.category) },
        ]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.preferenceDescription}>{item.description}</Text>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.categoryFilter}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && {
                  backgroundColor: getCategoryColor(item),
                },
                selectedCategory === null && item === '其他' && styles.categoryChipInactive,
              ]}
              onPress={() => {
                setSelectedCategory(selectedCategory === item ? null : item);
              }}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === item && styles.categoryChipTextActive,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredPreferences}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? '載入中...' : '還沒有伴侶偏好記錄，點擊右下角新增'}
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
              {editingPreference ? '編輯偏好' : '新增偏好'}
            </Text>

            <Text style={styles.label}>分類</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && {
                      backgroundColor: getCategoryColor(cat),
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            <TextInput
              style={styles.input}
              placeholder="標籤 (用逗號分隔)"
              value={tagsInput}
              onChangeText={setTagsInput}
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
                onPress={savePreference}
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
  categoryFilter: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipInactive: {
    backgroundColor: '#f0f0f0',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  preferenceCard: {
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
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
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
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
