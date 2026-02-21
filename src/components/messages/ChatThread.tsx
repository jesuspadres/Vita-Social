import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MoreVertical,
  ArrowUp,
  AlertTriangle,
  Ban,
  UserX,
  Sparkles,
} from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  runOnJS,
} from "react-native-reanimated";
import { Avatar } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { AiIcebreaker } from "@/components/messages/AiIcebreaker";
import { ReportSheet } from "@/components/moderation/ReportSheet";
import { BlockConfirmSheet } from "@/components/moderation/BlockConfirmSheet";
import { UnmatchConfirmSheet } from "@/components/moderation/UnmatchConfirmSheet";
import { UserProfilePage } from "@/components/profile/UserProfilePage";
import { ConversationInfoPage } from "@/components/messages/ConversationInfoPage";
import { AiIcebreakerSheet } from "@/components/messages/AiIcebreakerSheet";
import {
  getMessagesForUser,
  CURRENT_USER_ID,
  type MockConversationUser,
  type MockMessage,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatThreadProps {
  /** The conversation partner */
  user: MockConversationUser;
  /** Whether this is a brand-new conversation (show icebreaker) */
  isNewConversation?: boolean;
  /** Back navigation handler */
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

/** Auto-reply messages for simulation */
const autoReplies = [
  "That sounds great! I'm in.",
  "Haha absolutely! When are you free?",
  "I was just thinking the same thing!",
  "Love that idea. Let's make it happen!",
  "For sure! Send me the details.",
  "Ooh nice! I've been wanting to try that.",
];

function getRandomReply(): string {
  return autoReplies[Math.floor(Math.random() * autoReplies.length)];
}

/** Check if there's a >30min gap between two messages */
function hasTimestampGap(a: string, b: string): boolean {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff > 30 * 60 * 1000; // 30 minutes
}

function formatTimeSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / 86400000,
  );

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) {
    const day = date.toLocaleDateString(undefined, { weekday: "long" });
    return `${day} ${time}`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Message list item type
// ---------------------------------------------------------------------------

type ListItem =
  | { type: "message"; data: MockMessage; isLastInCluster: boolean; showTimestamp: boolean }
  | { type: "separator"; label: string; id: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatThread({
  user,
  isNewConversation = false,
  onBack,
}: ChatThreadProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<MockMessage[]>(() =>
    getMessagesForUser(user.id),
  );
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showBlockSheet, setShowBlockSheet] = useState(false);
  const [showUnmatchSheet, setShowUnmatchSheet] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showAiIcebreaker, setShowAiIcebreaker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Slide-in animation
  const translateX = useSharedValue(400);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [translateX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Swipe-right-to-go-back gesture
  const panGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD
      ) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onBack)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const handleBack = useCallback(() => {
    translateX.value = withTiming(400, { duration: 250 });
    setTimeout(onBack, 260);
  }, [translateX, onBack]);

  // Build list items with timestamp separators (reversed for inverted list)
  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    // Messages are in chronological order; FlatList is inverted so we reverse
    const sorted = [...messages].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    for (let i = 0; i < sorted.length; i++) {
      const msg = sorted[i];
      const prev = sorted[i + 1]; // previous = older (inverted)
      const next = sorted[i - 1]; // next = newer (inverted)

      // Is this the last message in a cluster from same sender?
      const isLastInCluster =
        !next || next.sender_id !== msg.sender_id;

      // Show timestamp if last in cluster
      const showTimestamp = isLastInCluster;

      items.push({
        type: "message",
        data: msg,
        isLastInCluster,
        showTimestamp,
      });

      // Add time separator if gap between this and older message
      if (prev && hasTimestampGap(msg.created_at, prev.created_at)) {
        items.push({
          type: "separator",
          label: formatTimeSeparator(msg.created_at),
          id: `sep-${msg.id}`,
        });
      }
    }

    return items;
  }, [messages]);

  // Send message
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: MockMessage = {
      id: `sent-${Date.now()}`,
      conversation_id: `conv-${user.id}`,
      sender_id: CURRENT_USER_ID,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Simulate typing + auto-reply
    const typingDelay = 1500 + Math.random() * 1500;
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reply: MockMessage = {
        id: `reply-${Date.now()}`,
        conversation_id: `conv-${user.id}`,
        sender_id: user.id,
        content: getRandomReply(),
        created_at: new Date().toISOString(),
        read_at: null,
      };
      setMessages((prev) => [...prev, reply]);
    }, typingDelay);
  }, [inputText, user.id]);

  // AI Icebreaker prompt handler
  const handleIcebreakerPrompt = useCallback(
    (prompt: string) => {
      setInputText(prompt);
    },
    [],
  );

  // Render list items
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "separator") {
        return (
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{item.label}</Text>
            <View style={styles.separatorLine} />
          </View>
        );
      }

      return (
        <View style={styles.messageContainer}>
          <MessageBubble
            content={item.data.content}
            timestamp={item.data.created_at}
            isSent={item.data.sender_id === CURRENT_USER_ID}
            isRead={item.data.read_at !== null}
            showTimestamp={item.showTimestamp}
            isLastInCluster={item.isLastInCluster}
          />
        </View>
      );
    },
    [],
  );

  const keyExtractor = useCallback(
    (item: ListItem) =>
      item.type === "separator" ? item.id : item.data.id,
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
    <Animated.View
      style={[styles.overlay, slideStyle, { paddingTop: 0 }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={styles.headerButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#1A365D" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Pressable
              onPress={() => setShowUserProfile(true)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${user.first_name}'s profile`}
            >
              <Avatar
                size="sm"
                src={user.avatar_url}
                name={user.first_name}
                online={user.online}
              />
            </Pressable>
            <Pressable
              onPress={() => setShowConversationInfo(true)}
              style={styles.headerNameArea}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`View ${user.first_name}'s info`}
            >
              <Text style={styles.headerName}>{user.first_name}</Text>
              {user.online && (
                <Text style={styles.headerOnline}>Online</Text>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() => setShowMenu((p) => !p)}
            hitSlop={8}
            style={styles.headerButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <MoreVertical size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Menu Backdrop */}
        {showMenu && (
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setShowMenu(false)}
          />
        )}

        {/* Dropdown Menu */}
        {showMenu && (
          <Animated.View
            entering={FadeIn.duration(150)}
            style={styles.menu}
          >
            <Pressable
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); setShowReportSheet(true); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Report ${user.first_name}`}
            >
              <AlertTriangle size={16} color="#D69E2E" />
              <Text style={styles.menuItemText}>Report</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); setShowBlockSheet(true); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Block ${user.first_name}`}
            >
              <Ban size={16} color="#E53E3E" />
              <Text style={[styles.menuItemText, { color: "#E53E3E" }]}>
                Block
              </Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); setShowUnmatchSheet(true); }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Unmatch ${user.first_name}`}
            >
              <UserX size={16} color="#6B7280" />
              <Text style={styles.menuItemText}>Unmatch</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={listItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDots}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            isNewConversation && user.interests ? (
              <AiIcebreaker
                sharedInterests={user.interests}
                onSelectPrompt={handleIcebreakerPrompt}
              />
            ) : null
          }
        />

        {/* Input Area */}
        <View
          style={[
            styles.inputArea,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            onPress={() => setShowAiIcebreaker(true)}
            style={styles.sparklesButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Open AI icebreakers"
            accessibilityHint="Get AI-generated conversation starters"
            hitSlop={4}
          >
            <Sparkles size={20} color="#4A90A4" strokeWidth={1.75} />
          </Pressable>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            style={styles.textInput}
            multiline
            maxLength={1000}
          />
          {inputText.trim().length > 0 && (
            <Pressable
              onPress={handleSend}
              style={styles.sendButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityHint="Sends your typed message"
            >
              <ArrowUp size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Moderation Sheets */}
      <ReportSheet
        visible={showReportSheet}
        onClose={() => setShowReportSheet(false)}
        userName={user.first_name}
        userId={user.id}
      />
      <BlockConfirmSheet
        visible={showBlockSheet}
        onClose={() => setShowBlockSheet(false)}
        userName={user.first_name}
        userAvatar={user.avatar_url ?? ""}
        onConfirm={() => { setShowBlockSheet(false); handleBack(); }}
      />
      <UnmatchConfirmSheet
        visible={showUnmatchSheet}
        onClose={() => setShowUnmatchSheet(false)}
        userName={user.first_name}
        userAvatar={user.avatar_url ?? ""}
        onConfirm={() => { setShowUnmatchSheet(false); handleBack(); }}
      />
      {showUserProfile && (
        <UserProfilePage
          user={{
            id: user.id,
            first_name: user.first_name,
            avatar_url: user.avatar_url ?? "",
            interests: user.interests,
            online: user.online,
          }}
          onClose={() => setShowUserProfile(false)}
        />
      )}
      {showConversationInfo && (
        <ConversationInfoPage
          user={{
            id: user.id,
            first_name: user.first_name,
            avatar_url: user.avatar_url,
            verification_level: user.verification_level,
            online: user.online,
            interests: user.interests,
          }}
          onClose={() => setShowConversationInfo(false)}
        />
      )}
      <AiIcebreakerSheet
        visible={showAiIcebreaker}
        onClose={() => setShowAiIcebreaker(false)}
        onSelectSuggestion={(text) => setInputText(text)}
        userName={user.first_name}
      />
    </Animated.View>
    </GestureDetector>
  );
}

ChatThread.displayName = "ChatThread";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 50,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  headerNameArea: {
    flex: 1,
    justifyContent: "center" as const,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  headerOnline: {
    fontSize: 11,
    color: "#38A169",
    fontFamily: "Inter_400Regular",
  },

  // Menu
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 19,
  },
  menu: {
    position: "absolute",
    top: 100,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  menuItemText: {
    fontSize: 14,
    color: "#374151",
    fontFamily: "Inter_500Medium",
  },

  // Message List
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageContainer: {
    paddingHorizontal: 4,
  },

  // Timestamp Separator
  separatorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
  },
  separatorText: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

  // Typing Indicator
  typingContainer: {
    alignSelf: "flex-start",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  typingBubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 6,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A0AEC0",
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },

  // Input Area
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    minHeight: 48,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sparklesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
