import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { authAPI, touristAPI } from "../../constants/api";
import {
    buildChatRoomId,
    deleteChatMessage,
    editChatMessage,
    FirestoreMessage,
    getChatPresence,
    registerChatPresence,
    sendChatMessage,
    subscribeToChatMessages,
    upsertChatRoom,
} from "../../constants/firebase";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristMessagesProps {
  onBack: () => void;
}

interface UserRef {
  user_id: number;
  full_name: string;
  role?: string;
  email?: string;
}

interface MessageItem {
  id: number;
  sender?: UserRef;
  receiver?: UserRef;
  content: string;
  isRead?: boolean;
  sentAt?: string;
}

interface TouristBookingContact {
  bookingId: number;
  guideId: number;
  guideName: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface ThreadMessage {
  id: string;
  senderUserId?: number;
  receiverUserId?: number;
  text: string;
  deleted?: boolean;
  createdAt?: string;
  editedAt?: string;
  fromFirestore: boolean;
}

interface ChatPreview {
  bookingId: number;
  guideId: number;
  guideName: string;
  previewText: string;
  previewAt?: string;
  unreadCount: number;
}

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const formatChatListTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate();

  if (isYesterday) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const formatThreadTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const initials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export function TouristMessages({ onBack }: TouristMessagesProps) {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "thread">("list");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<TouristBookingContact[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<FirestoreMessage[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "ready" | "pending" | "error">(
    "idle"
  );

  const selectedBooking = useMemo(
    () => acceptedBookings.find((item) => item.bookingId === selectedBookingId) || null,
    [acceptedBookings, selectedBookingId]
  );

  const activeReceiverId = selectedBooking?.guideId ?? null;
  const hasActiveThread =
    Boolean(currentUserId) &&
    Number.isInteger(activeReceiverId || 0) &&
    Number.isInteger(selectedBooking?.bookingId || 0);

  const loadMessages = useCallback(async () => {
    setLoading(true);

    try {
      const [user, messageResponse, bookingsResponse] = await Promise.all([
        authAPI.getCurrentUser(),
        touristAPI.getMessages(),
        touristAPI.getBookings(),
      ]);

      const appUserId = Number(user?.id || null);
      const userId = Number.isInteger(appUserId) && appUserId > 0 ? appUserId : null;

      setCurrentUserId(userId);
      setCurrentUserName(String(user?.fullName || user?.full_name || ""));
      setCurrentUserRole(String(user?.role || ""));
      setCurrentUserEmail(String(user?.email || ""));

      if (userId) {
        await registerChatPresence({
          appUserId: userId,
          fullName: String(user?.fullName || user?.full_name || ""),
          role: String(user?.role || ""),
          email: String(user?.email || ""),
        });
      }

      const rawMessages = (messageResponse?.data?.messages || []) as MessageItem[];
      setMessages(rawMessages);

      const rawBookings = (bookingsResponse?.data?.bookings || []) as any[];
      const bookingContacts = rawBookings
        .map((booking) => {
          const bookingId = Number(booking?.id || booking?.bookingId || 0);
          const guideId = Number(booking?.guide?.id || booking?.guideId || 0);
          const status = String(booking?.status || "").toLowerCase();

          return {
            bookingId,
            guideId,
            guideName: String(booking?.guide?.name || booking?.guideName || `Guide #${guideId}`),
            status,
            startDate: booking?.startDate ? String(booking.startDate) : undefined,
            endDate: booking?.endDate ? String(booking.endDate) : undefined,
          } satisfies TouristBookingContact;
        })
        .filter(
          (item) =>
            Number.isInteger(item.bookingId) &&
            item.bookingId > 0 &&
            Number.isInteger(item.guideId) &&
            item.guideId > 0 &&
            item.status === "confirmed"
        );

      const uniqueByGuide = new Map<number, TouristBookingContact>();
      bookingContacts.forEach((item) => {
        if (!uniqueByGuide.has(item.guideId)) {
          uniqueByGuide.set(item.guideId, item);
        }
      });

      const contacts = Array.from(uniqueByGuide.values());
      setAcceptedBookings(contacts);

      const hasCurrentSelection =
        selectedBookingId !== null && contacts.some((item) => item.bookingId === selectedBookingId);

      if (!hasCurrentSelection) {
        setSelectedBookingId(contacts[0]?.bookingId || null);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [selectedBookingId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (viewMode !== "thread" || !currentUserId || !activeReceiverId || !selectedBooking) {
      setChatRoomId(null);
      setRealtimeMessages([]);
      setEditingMessageId(null);
      setRealtimeStatus("idle");
      return;
    }

    const roomId = buildChatRoomId(currentUserId, activeReceiverId);
    setChatRoomId(roomId);
    setRealtimeStatus("ready");

    const unsubscribe = subscribeToChatMessages(
      roomId,
      (nextMessages) => {
        setRealtimeMessages(nextMessages);
      },
      () => {
        setRealtimeStatus("error");
      }
    );

    return () => unsubscribe();
  }, [viewMode, currentUserId, activeReceiverId, selectedBooking]);

  const backendThreadMessages = useMemo<ThreadMessage[]>(() => {
    if (!selectedBooking || !activeReceiverId || !currentUserId) {
      return [];
    }

    return messages
      .filter((item) => {
        const senderId = Number(item.sender?.user_id || 0);
        const receiverId = Number(item.receiver?.user_id || 0);

        return (
          (senderId === currentUserId && receiverId === activeReceiverId) ||
          (senderId === activeReceiverId && receiverId === currentUserId)
        );
      })
      .map((item) => ({
        id: `legacy-${item.id}`,
        senderUserId: item.sender?.user_id,
        receiverUserId: item.receiver?.user_id,
        text: item.content,
        deleted: false,
        createdAt: item.sentAt,
        editedAt: undefined,
        fromFirestore: false,
      }));
  }, [messages, selectedBooking, activeReceiverId, currentUserId]);

  const realtimeThreadMessages = useMemo<ThreadMessage[]>(() => {
    return realtimeMessages.map((item) => ({
      id: item.id,
      senderUserId: item.senderUserId,
      receiverUserId: item.receiverUserId,
      text: item.text,
      deleted: item.deleted,
      createdAt: item.createdAt,
      editedAt: item.editedAt,
      fromFirestore: true,
    }));
  }, [realtimeMessages]);

  const threadMessages = useMemo(() => {
    const source = realtimeThreadMessages.length > 0 ? realtimeThreadMessages : backendThreadMessages;
    return [...source].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
  }, [realtimeThreadMessages, backendThreadMessages]);

  const chatPreviews = useMemo<ChatPreview[]>(() => {
    if (!currentUserId) return [];

    return acceptedBookings
      .map((booking) => {
        const thread = messages
          .filter((item) => {
            const senderId = Number(item.sender?.user_id || 0);
            const receiverId = Number(item.receiver?.user_id || 0);
            return (
              (senderId === currentUserId && receiverId === booking.guideId) ||
              (senderId === booking.guideId && receiverId === currentUserId)
            );
          })
          .sort((a, b) => toTimestamp(b.sentAt) - toTimestamp(a.sentAt));

        const last = thread[0];
        const unread = thread.filter((item) => {
          const receiverId = Number(item.receiver?.user_id || 0);
          return receiverId === currentUserId && !Boolean(item.isRead);
        }).length;

        return {
          bookingId: booking.bookingId,
          guideId: booking.guideId,
          guideName: booking.guideName,
          previewText: last?.content || "Tap to start chatting",
          previewAt: last?.sentAt,
          unreadCount: unread,
        } satisfies ChatPreview;
      })
      .sort((a, b) => toTimestamp(b.previewAt) - toTimestamp(a.previewAt));
  }, [acceptedBookings, messages, currentUserId]);

  const openThread = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setEditingMessageId(null);
    setContent("");
    setViewMode("thread");
  };

  const sendMessage = async () => {
    if (!selectedBooking || !activeReceiverId || !currentUserId) {
      Alert.alert("Chat Locked", "Chat unlocks only after your booking is accepted.");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Validation", "Message content is required");
      return;
    }

    if (editingMessageId) {
      if (!chatRoomId) {
        Alert.alert("Edit Unavailable", "Unable to resolve chat room for editing.");
        return;
      }

      setSending(true);
      try {
        await editChatMessage(chatRoomId, editingMessageId, content.trim());
        setEditingMessageId(null);
        setContent("");
      } catch (error: any) {
        Alert.alert(
          "Update Failed",
          error?.message || "Unable to edit message. Check Firestore update rules."
        );
      } finally {
        setSending(false);
      }

      return;
    }

    setSending(true);
    try {
      await touristAPI.sendMessage({
        bookingId: selectedBooking.bookingId,
        receiverId: activeReceiverId,
        content: content.trim(),
      });

      const senderPresence = await registerChatPresence({
        appUserId: currentUserId,
        fullName: currentUserName,
        role: currentUserRole,
        email: currentUserEmail,
      });
      const receiverPresence = await getChatPresence(activeReceiverId);

      if (senderPresence?.firebaseUid && receiverPresence?.firebaseUid) {
        const roomId = buildChatRoomId(currentUserId, activeReceiverId);
        setChatRoomId(roomId);

        const participantFirebaseUids = [senderPresence.firebaseUid, receiverPresence.firebaseUid].sort();

        await upsertChatRoom({
          chatRoomId: roomId,
          participantFirebaseUids,
          participantUserIds: [currentUserId, activeReceiverId],
          participantNames: {
            [String(currentUserId)]: currentUserName || `User #${currentUserId}`,
            [String(activeReceiverId)]: selectedBooking.guideName,
          },
          lastMessageText: content.trim(),
        });

        await sendChatMessage({
          chatRoomId: roomId,
          senderFirebaseUid: senderPresence.firebaseUid,
          senderUserId: currentUserId,
          receiverUserId: activeReceiverId,
          text: content.trim(),
        });

        setRealtimeStatus("ready");
      } else {
        setRealtimeStatus("pending");
        Alert.alert(
          "Realtime Pending",
          "Message sent. Realtime sync starts after the guide opens the updated app once."
        );
      }

      setContent("");
      await loadMessages();
    } catch (error: any) {
      Alert.alert("Send Failed", error?.message || "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteRealtimeMessage = async (messageId: string) => {
    if (!chatRoomId) {
      return;
    }

    try {
      await deleteChatMessage(chatRoomId, messageId);
    } catch (error: any) {
      Alert.alert(
        "Delete Failed",
        error?.message || "Unable to delete message. Check Firestore update rules."
      );
    }
  };

  const onMessageLongPress = (item: ThreadMessage) => {
    const isMine = item.senderUserId === currentUserId;
    if (!isMine || !item.fromFirestore || item.deleted) {
      return;
    }

    Alert.alert("Message Options", "Choose an action", [
      {
        text: "Edit",
        onPress: () => {
          setEditingMessageId(item.id);
          setContent(item.text);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void handleDeleteRealtimeMessage(item.id);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderChatRow = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity style={styles.chatRow} onPress={() => openThread(item.bookingId)}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials(item.guideName)}</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.chatBody}>
        <Text style={styles.chatName}>{item.guideName}</Text>
        <Text style={styles.chatPreview} numberOfLines={1}>
          {item.previewText}
        </Text>
      </View>

      <View style={styles.chatMeta}>
        <Text style={styles.chatTime}>{formatChatListTime(item.previewAt)}</Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderThreadItem = ({ item }: { item: ThreadMessage }) => {
    const isMine = item.senderUserId === currentUserId;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onMessageLongPress(item)}
        delayLongPress={300}
        style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowOther]}
      >
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
            {item.deleted ? "Message deleted" : item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>{formatThreadTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (viewMode === "list") {
    return (
      <View style={styles.screen}>
        <TouristTopBar title="Chats" subtitle="Connect with your guides" onBack={onBack} />

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#209CEE" />
          </View>
        ) : chatPreviews.length === 0 ? (
          <View style={styles.centerState}>
            <MaterialCommunityIcons name="message-lock-outline" size={56} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>Chats unlock when a guide confirms your booking.</Text>
          </View>
        ) : (
          <FlatList
            data={chatPreviews}
            keyExtractor={(item) => String(item.bookingId)}
            renderItem={renderChatRow}
            contentContainerStyle={styles.chatListContent}
            ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
    >
      <TouristTopBar
        title={selectedBooking?.guideName || "Guide Chat"}
        subtitle={`Booking #${selectedBooking?.bookingId || "-"}`}
        onBack={() => {
          setEditingMessageId(null);
          setContent("");
          setViewMode("list");
        }}
      />

      <FlatList
        data={threadMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderThreadItem}
        contentContainerStyle={styles.threadContent}
        ListHeaderComponent={
          <Text style={styles.threadHint}>
            {hasActiveThread
              ? realtimeStatus === "error"
                ? "Realtime unavailable. Backend chat still works."
                : editingMessageId
                ? "Editing selected message"
                : "Long press your sent message to edit or delete."
              : "Chat is locked until booking confirmation."}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.centerStateCompact}>
            <MaterialCommunityIcons name="chat-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptySubtitle}>No messages in this chat yet.</Text>
          </View>
        }
      />

      <View style={styles.composerWrap}>
        <View style={styles.composerInputWrap}>
          <TouchableOpacity style={styles.composerIconButton}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            style={styles.composerInput}
            value={content}
            onChangeText={setContent}
            placeholder={
              hasActiveThread
                ? editingMessageId
                  ? "Edit your message"
                  : "Type your message..."
                : "Chat is locked until booking confirmation"
            }
            editable={hasActiveThread && !sending}
            multiline
          />

          {editingMessageId && (
            <TouchableOpacity
              style={styles.composerIconButton}
              onPress={() => {
                setEditingMessageId(null);
                setContent("");
              }}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.sendFab, (!hasActiveThread || sending) && styles.sendFabDisabled]}
          disabled={!hasActiveThread || sending}
          onPress={() => void sendMessage()}
        >
          <MaterialCommunityIcons
            name={sending ? "loading" : "send"}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  listHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  chatListContent: {
    paddingVertical: 8,
  },
  chatRow: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 74,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    marginRight: 12,
    position: "relative",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#22C55E",
  },
  chatBody: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  chatPreview: {
    marginTop: 3,
    fontSize: 15,
    color: "#6B7280",
  },
  chatMeta: {
    alignItems: "flex-end",
    minWidth: 64,
    marginLeft: 8,
  },
  chatTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  threadHeader: {
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  threadIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  threadIdentityTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  threadName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  threadMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  threadContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexGrow: 1,
  },
  threadHint: {
    alignSelf: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    color: "#6B7280",
    fontSize: 11,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: "#1DA1F2",
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: "#FFFFFF",
  },
  bubbleTime: {
    marginTop: 4,
    textAlign: "right",
    fontSize: 11,
    color: "#6B7280",
  },
  bubbleTimeMine: {
    color: "#DBEAFE",
  },
  centerStateCompact: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    gap: 6,
  },
  composerWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  composerInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  composerIconButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "center",
  },
  sendFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1DA1F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendFabDisabled: {
    opacity: 0.45,
  },
});