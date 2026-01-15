import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        loadProfile(user.id);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setPartnerName(data.partner_name || '');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newProfile = {
            id: user.id,
            email: user.email || '',
            partner_name: '',
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (!insertError) {
            setProfile(newProfile as Profile);
          }
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('提示', '請填寫電子郵件和密碼');
      return;
    }

    try {
      setLoading(true);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        Alert.alert('成功', '登入成功！');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        Alert.alert('成功', '註冊成功！請登入。');
        setIsLogin(true);
      }

      checkAuth();
    } catch (error: any) {
      Alert.alert('錯誤', error.message || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('確認登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setProfile(null);
            setPartnerName('');
            setEmail('');
            setPassword('');
          } catch (error) {
            Alert.alert('錯誤', '登出失敗');
          }
        },
      },
    ]);
  };

  const updateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ partner_name: partnerName })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('成功', '個人資料已更新');
      setProfile({ ...profile, partner_name: partnerName });
    } catch (error) {
      Alert.alert('錯誤', '無法更新個人資料');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>
            {isLogin ? '登入' : '註冊'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="電子郵件"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="密碼"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <Text style={styles.authButtonText}>
              {isLogin ? '登入' : '註冊'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin ? '還沒有帳號？點此註冊' : '已有帳號？點此登入'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.profileContainer}>
      <View style={styles.profileCard}>
        <Text style={styles.sectionTitle}>個人資料</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>電子郵件</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>伴侶名稱</Text>
        <TextInput
          style={styles.input}
          placeholder="輸入伴侶名稱"
          value={partnerName}
          onChangeText={setPartnerName}
        />

        <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
          <Text style={styles.saveButtonText}>儲存變更</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>使用統計</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>重要日期</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>待辦事項</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>伴侶偏好</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>登出</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>版本 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  authButton: {
    backgroundColor: '#FF6B9D',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#FF6B9D',
    fontSize: 14,
  },
  profileContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 20,
  },
});
