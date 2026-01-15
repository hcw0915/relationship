import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Relationship {
  id: string;
  name: string;
  relationship_type: string;
  priority_order: number;
  met_date: string | null;
  notes: string | null;
}

export default function RelationshipsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRelationships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error loading relationships:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRelationships();
    });

    return unsubscribe;
  }, [navigation, user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRelationships();
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '確認刪除',
      `確定要刪除 ${name} 嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('relationships')
                .delete()
                .eq('id', id);

              if (error) throw error;
              loadRelationships();
            } catch (error) {
              Alert.alert('錯誤', '刪除失敗');
            }
          },
        },
      ]
    );
  };

  const formatRelationshipType = (type: string) => {
    const types: { [key: string]: string } = {
      partner: '伴侶',
      colleague: '同事',
      supervisor: '上司',
      subordinate: '下屬',
      friend: '朋友',
      family: '家人',
      other: '其他',
    };
    return types[type] || type;
  };

  const renderItem = ({ item }: { item: Relationship }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RelationshipDetail', { relationshipId: item.id })}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardType}>{formatRelationshipType(item.relationship_type)}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditRelationship', { relationshipId: item.id })}
          >
            <Edit size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id, item.name)}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View>
          <Text style={styles.headerTitle}>關係人列表</Text>
          <Text style={styles.headerSubtitle}>共 {relationships.length} 位</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddRelationship')}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {relationships.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>尚無關係人</Text>
          <Text style={styles.emptySubtext}>點擊右上角按鈕新增</Text>
        </View>
      ) : (
        <FlatList
          data={relationships}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
