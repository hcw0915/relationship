import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Edit, MessageSquare, Star } from 'lucide-react-native';
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

export default function RelationshipDetailScreen({ route, navigation }: any) {
  const { relationshipId } = route.params;
  const insets = useSafeAreaInsets();
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelationship();
  }, [relationshipId]);

  const loadRelationship = async () => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('id', relationshipId)
        .single();

      if (error) throw error;
      setRelationship(data);
    } catch (error) {
      Alert.alert('錯誤', '載入資料失敗');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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

  const calculateDaysSince = (metDate: string | null) => {
    if (!metDate) return null;
    const today = new Date();
    const met = new Date(metDate);
    const diffTime = Math.abs(today.getTime() - met.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!relationship) {
    return null;
  }

  const daysSince = calculateDaysSince(relationship.met_date);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerContentLeft}>
            <Text style={styles.name}>{relationship.name}</Text>
            <Text style={styles.type}>
              {formatRelationshipType(relationship.relationship_type)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              navigation.navigate('EditRelationship', { relationshipId: relationship.id })
            }
          >
            <Edit size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Star size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>優先度</Text>
            </View>
            <Text style={styles.infoValue}>#{relationship.priority_order + 1}</Text>
          </View>

          {relationship.met_date && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Calendar size={20} color="#3B82F6" />
                <Text style={styles.infoLabel}>認識日期</Text>
              </View>
              <Text style={styles.infoValue}>{formatDate(relationship.met_date)}</Text>
              {daysSince && (
                <Text style={styles.infoSubtext}>認識 {daysSince} 天</Text>
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={20} color="#3B82F6" />
              <Text style={styles.infoLabel}>建立時間</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(relationship.created_at)}</Text>
          </View>
        </View>

        {relationship.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={20} color="#1F2937" />
              <Text style={styles.sectionTitle}>備註</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{relationship.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>相關功能</Text>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>重要日期</Text>
            <Text style={styles.actionSubtext}>管理與此關係人相關的重要日期</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>行動備忘</Text>
            <Text style={styles.actionSubtext}>記錄待辦事項與提醒</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionText}>偏好設定</Text>
            <Text style={styles.actionSubtext}>記錄喜好與偏好</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContentLeft: {
    flex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  type: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
