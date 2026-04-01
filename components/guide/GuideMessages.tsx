import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authAPI, guideAPI } from "../../constants/api";

interface GuideMessagesProps {
  onBack: () => void;
}

interface UserRef {
  user_id: number;
  full_name: string;
  role?: string;
}

interface MessageItem {
  id: number;
  sender?: UserRef;
  receiver?: UserRef;
  content: string;
  isRead?: boolean;
  sentAt?: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export function GuideMessages({ onBack }: GuideMessagesProps) {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const [user, response] = await Promise.all([
        authAPI.getCurrentUser(),
        guideAPI.getMessages(),
      ]);
      setCurrentUserId(Number(user?.id || null));
      setMessages((response?.data?.messages || []) as MessageItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const groupedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = a.sentAt ? new Date(a.sentAt).getTime() : 0;
      const bTime = b.sentAt ? new Date(b.sentAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [messages]);

  const sendMessage = async () => {
    const parsedReceiverId = Number.parseInt(receiverId, 10);
    if (!Number.isInteger(parsedReceiverId) || parsedReceiverId <= 0) {
      Alert.alert("Validation", "Receiver ID must be a valid user ID");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Validation", "Message content is required");
      return;
    }

    setSending(true);
    try {
      await guideAPI.sendMessage({
        receiverId: parsedReceiverId,
        content: content.trim(),
      });
      setContent("");
      await loadMessages();
    } catch (error: any) {
      Alert.alert("Send Failed", error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    const isSentByMe = item.sender?.user_id === currentUserId;
    const counterpart = isSentByMe ? item.receiver : item.sender;

    return (
      <View style={[styles.messageCard, isSentByMe && styles.sentCard]}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{counterpart?.full_name || "Unknown user"}</Text>
          <Text style={styles.timeText}>{formatDateTime(item.sentAt)}</Text>
        </View>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.metaText}>
          {isSentByMe ? "Sent" : "Received"} {item.isRead ? "• Read" : "• Unread"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guide Messages</Text>
        <Text style={styles.subtitle}>Communicate with tourists and hotels</Text>
      </View>

      <View style={styles.composeCard}>
        <TextInput
          style={styles.input}
          value={receiverId}
          onChangeText={setReceiverId}
          keyboardType="number-pad"
          placeholder="Receiver User ID"
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          value={content}
          onChangeText={setContent}
          placeholder="Write your message"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.disabledButton]}
          onPress={() => void sendMessage()}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>{sending ? "Sending..." : "Send Message"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : (
        <FlatList
          data={groupedMessages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message-text-outline" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No messages yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255, 255, 255, 0.9)", marginTop: 4 },
  composeCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    margin: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  sendButton: {
    backgroundColor: "#1B73E8",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  disabledButton: { opacity: 0.6 },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 12, gap: 8 },
  messageCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
  },
  sentCard: { borderColor: "#BFDBFE", backgroundColor: "#F8FBFF" },
  messageHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  userName: { fontSize: 13, fontWeight: "700", color: "#111827", flex: 1 },
  timeText: { fontSize: 11, color: "#6B7280" },
  messageText: { marginTop: 6, fontSize: 13, color: "#374151" },
  metaText: { marginTop: 8, fontSize: 11, color: "#6B7280" },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});
