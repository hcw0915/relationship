import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import {
  LogOut,
  User,
  Info,
  Shield,
  Tag,
  Plus,
  Edit,
  Trash2,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { supabase } from "../lib/supabase";
import type { RelationshipTag } from "../types/database";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { mode, setMode, color, setColor, colors } = useTheme();

  // 標籤管理相關 state
  const [tags, setTags] = useState<RelationshipTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<RelationshipTag | null>(null);
  const [tagLabel, setTagLabel] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [savingTag, setSavingTag] = useState(false);

  const handleSignOut = () => {
    Alert.alert("確認登出", "確定要登出嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("錯誤", "登出失敗");
          }
        },
      },
    ]);
  };

  const THEME_COLORS = [
    { name: "藍", value: "#3B82F6" },
    { name: "紫", value: "#8B5CF6" },
    { name: "綠", value: "#10B981" },
    { name: "橘", value: "#F59E0B" },
    { name: "紅", value: "#EF4444" },
    { name: "粉", value: "#EC4899" },
  ];

  // 載入標籤列表
  const loadTags = async () => {
    if (!user) return;
    try {
      setTagsLoading(true);
      const { data, error } = await supabase
        .from("relationship_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error("Error loading tags:", error);
      Alert.alert("錯誤", "無法載入標籤");
    } finally {
      setTagsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, [user]);

  // 開啟新增標籤 Modal
  const openAddTagModal = () => {
    setEditingTag(null);
    setTagLabel("");
    setTagValue("");
    setTagModalVisible(true);
  };

  // 開啟編輯標籤 Modal
  const openEditTagModal = (tag: RelationshipTag) => {
    setEditingTag(tag);
    setTagLabel(tag.label);
    setTagValue(tag.value);
    setTagModalVisible(true);
  };

  // 儲存標籤（新增或更新）
  const saveTag = async () => {
    if (!user) return;
    if (!tagLabel.trim() || !tagValue.trim()) {
      Alert.alert("錯誤", "請填寫標籤名稱和值");
      return;
    }

    setSavingTag(true);
    try {
      if (editingTag) {
        // 更新
        const { error } = await supabase
          .from("relationship_tags")
          .update({
            label: tagLabel.trim(),
            value: tagValue.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTag.id);

        if (error) throw error;
        Alert.alert("成功", "標籤已更新");
      } else {
        // 新增
        const maxSort =
          tags.length > 0 ? Math.max(...tags.map((t) => t.sort_order)) : -1;

        const { error } = await supabase.from("relationship_tags").insert([
          {
            user_id: user.id,
            label: tagLabel.trim(),
            value: tagValue.trim(),
            sort_order: maxSort + 1,
          },
        ]);

        if (error) throw error;
        Alert.alert("成功", "標籤已新增");
      }
      setTagModalVisible(false);
      loadTags();
    } catch (error: any) {
      Alert.alert("錯誤", error.message || "儲存失敗");
    } finally {
      setSavingTag(false);
    }
  };

  // 刪除標籤
  const deleteTag = (tag: RelationshipTag) => {
    Alert.alert("確認刪除", `確定要刪除「${tag.label}」嗎？`, [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("relationship_tags")
              .delete()
              .eq("id", tag.id);

            if (error) throw error;
            Alert.alert("成功", "標籤已刪除");
            loadTags();
          } catch (error) {
            Alert.alert("錯誤", "刪除失敗");
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <ScrollView style={styles.scrollView}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>設定</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              帳號資訊
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoRow}>
                <User size={20} color={colors.mutedText} />
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>
                  電子郵件
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              外觀設定
            </Text>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.itemLabel, { color: colors.mutedText }]}>
                模式
              </Text>
              <View style={styles.segment}>
                {(
                  [
                    { key: "system", label: "跟隨系統" },
                    { key: "light", label: "淺色" },
                    { key: "dark", label: "深色" },
                  ] as const
                ).map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.segmentItem,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                      mode === item.key && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setMode(item.key)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: colors.text },
                        mode === item.key && {
                          color: "#fff",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <Text style={[styles.itemLabel, { color: colors.mutedText }]}>
                主題色
              </Text>
              <View style={styles.colorRow}>
                {THEME_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c.value },
                      color && color.toUpperCase() === c.value.toUpperCase()
                        ? { borderColor: colors.text }
                        : { borderColor: "transparent" },
                    ]}
                    onPress={() => setColor(c.value)}
                    accessibilityLabel={`主題色 ${c.name}`}
                  />
                ))}
              </View>

              {/* 暫時註解掉自訂 HEX 輸入功能 */}
              {/* <Text style={[styles.hint, { color: colors.mutedText }]}>
                也可以輸入自訂色碼（HEX），例如 #3B82F6
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.card },
                ]}
                placeholder="#3B82F6"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="characters"
                value={color}
                onChangeText={(t) => setColor(t)}
              /> */}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                標籤管理
              </Text>
              <TouchableOpacity
                style={[
                  styles.addTagButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={openAddTagModal}
              >
                <Plus size={18} color="#fff" />
                <Text style={styles.addTagButtonText}>新增</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {tagsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[styles.loadingText, { color: colors.mutedText }]}
                  >
                    載入中...
                  </Text>
                </View>
              ) : tags.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Tag size={32} color={colors.mutedText} />
                  <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                    尚無標籤
                  </Text>
                  <Text
                    style={[styles.emptySubtext, { color: colors.mutedText }]}
                  >
                    點擊右上角「新增」按鈕建立第一個標籤
                  </Text>
                </View>
              ) : (
                tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[styles.tagItem, { borderColor: colors.border }]}
                  >
                    <View style={styles.tagItemLeft}>
                      <Tag size={18} color={colors.primary} />
                      <View style={styles.tagItemContent}>
                        <Text style={[styles.tagLabel, { color: colors.text }]}>
                          {tag.label}
                        </Text>
                        <Text
                          style={[styles.tagValue, { color: colors.mutedText }]}
                        >
                          {tag.value}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tagItemActions}>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => openEditTagModal(tag)}
                      >
                        <Edit size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tagActionButton}
                        onPress={() => deleteTag(tag)}
                      >
                        <Trash2 size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              應用資訊
            </Text>
            <TouchableOpacity
              style={[
                styles.menuItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.menuItemLeft}>
                <Info size={20} color={colors.mutedText} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  關於應用
                </Text>
              </View>
              <Text style={[styles.menuItemValue, { color: colors.mutedText }]}>
                v1.0.0
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.menuItemLeft}>
                <Shield size={20} color={colors.mutedText} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  隱私政策
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.dangerButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color={colors.danger} />
              <Text style={[styles.dangerButtonText, { color: colors.danger }]}>
                登出
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 標籤新增/編輯 Modal */}
      <Modal
        visible={tagModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingTag ? "編輯標籤" : "新增標籤"}
            </Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>
              標籤名稱 *
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="例如：伴侶"
              placeholderTextColor={colors.mutedText}
              value={tagLabel}
              onChangeText={setTagLabel}
              editable={!savingTag}
            />

            <Text style={[styles.modalLabel, { color: colors.text }]}>
              標籤值 *
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="例如：partner"
              placeholderTextColor={colors.mutedText}
              value={tagValue}
              onChangeText={setTagValue}
              autoCapitalize="none"
              editable={!savingTag}
            />
            <Text style={[styles.modalHint, { color: colors.mutedText }]}>
              標籤值用於系統內部，建議使用英文小寫
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  { borderColor: colors.border },
                ]}
                onPress={() => setTagModalVisible(false)}
                disabled={savingTag}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                  savingTag && styles.modalButtonDisabled,
                ]}
                onPress={saveTag}
                disabled={savingTag}
              >
                {savingTag ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>儲存</Text>
                )}
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTagButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  tagItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  tagItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  tagItemContent: {
    flex: 1,
  },
  tagLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  tagValue: {
    fontSize: 12,
  },
  tagItemActions: {
    flexDirection: "row",
    gap: 8,
  },
  tagActionButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalHint: {
    fontSize: 12,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {
    // backgroundColor 在 style prop 中動態設定
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSave: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItem: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemValue: {
    fontSize: 14,
  },
  dangerButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
