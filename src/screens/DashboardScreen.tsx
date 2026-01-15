import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, Plus, Calendar, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Relationship {
  id: string;
  name: string;
  relationship_type: string;
  priority_order: number;
  met_date: string | null;
  notes: string | null;
  created_at: string;
}

export default function DashboardScreen({ navigation }: any) {
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
        .order('priority_order', { ascending: true });

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
    loadRelationships();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRelationships();
  };

  const calculateDaysSince = (metDate: string | null) => {
    if (!metDate) return null;
    const today = new Date();
    const met = new Date(metDate);
    const diffTime = Math.abs(today.getTime() - met.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  const renderRelationshipCard = ({ item }: { item: Relationship }) => {
    const daysSince = calculateDaysSince(item.met_date);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RelationshipDetail', { relationshipId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardType}>{formatRelationshipType(item.relationship_type)}</Text>
          </View>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>#{item.priority_order + 1}</Text>
          </View>
        </View>

        {daysSince && (
          <View style={styles.cardInfo}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.cardInfoText}>認識 {daysSince} 天</Text>
          </View>
        )}

        {item.notes && (
          <Text style={styles.cardNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.headerTitle}>關係人儀表板</Text>
          <Text style={styles.headerSubtitle}>共 {relationships.length} 位關係人</Text>
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
          <Text style={styles.emptySubtext}>點擊右上角按鈕新增第一位關係人</Text>
        </View>
      ) : (
        <FlatList
          data={relationships}
          renderItem={renderRelationshipCard}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
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
    color: '#3B82F6',
    fontWeight: '500',
  },
  priorityBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardNotes: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
