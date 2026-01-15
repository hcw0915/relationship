import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RELATIONSHIP_TYPES = [
  { value: 'partner', label: '伴侶' },
  { value: 'colleague', label: '同事' },
  { value: 'supervisor', label: '上司' },
  { value: 'subordinate', label: '下屬' },
  { value: 'friend', label: '朋友' },
  { value: 'family', label: '家人' },
  { value: 'other', label: '其他' },
];

export default function AddEditRelationshipScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { relationshipId } = route.params || {};
  const isEditing = !!relationshipId;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [relationshipType, setRelationshipType] = useState('friend');
  const [metDate, setMetDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEditing) {
      loadRelationship();
    }
  }, [relationshipId]);

  const loadRelationship = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('id', relationshipId)
        .single();

      if (error) throw error;

      setName(data.name);
      setRelationshipType(data.relationship_type);
      setMetDate(data.met_date || '');
      setNotes(data.notes || '');
    } catch (error) {
      Alert.alert('錯誤', '載入資料失敗');
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入姓名');
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('relationships')
          .update({
            name: name.trim(),
            relationship_type: relationshipType,
            met_date: metDate || null,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', relationshipId);

        if (error) throw error;
        Alert.alert('成功', '已更新關係人');
      } else {
        const { data: existingRelationships, error: countError } = await supabase
          .from('relationships')
          .select('priority_order')
          .eq('user_id', user?.id)
          .order('priority_order', { ascending: false })
          .limit(1);

        if (countError) throw countError;

        const nextPriority = existingRelationships && existingRelationships.length > 0
          ? existingRelationships[0].priority_order + 1
          : 0;

        const { error } = await supabase
          .from('relationships')
          .insert({
            user_id: user?.id,
            name: name.trim(),
            relationship_type: relationshipType,
            met_date: metDate || null,
            notes: notes.trim() || null,
            priority_order: nextPriority,
          });

        if (error) throw error;
        Alert.alert('成功', '已新增關係人');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ height: insets.top }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>姓名 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="請輸入姓名"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>關係類型</Text>
          <View style={styles.typeGrid}>
            {RELATIONSHIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeButton,
                  relationshipType === type.value && styles.typeButtonActive,
                ]}
                onPress={() => setRelationshipType(type.value)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    relationshipType === type.value && styles.typeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>認識日期</Text>
          <TextInput
            style={styles.input}
            value={metDate}
            onChangeText={setMetDate}
            placeholder="YYYY-MM-DD"
            editable={!loading}
          />
          <Text style={styles.hint}>格式：年-月-日，例如 2024-01-15</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>備註</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="輸入備註..."
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? '儲存' : '新增'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
