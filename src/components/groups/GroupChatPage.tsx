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
import { ArrowLeft, Settings, ArrowUp } from "lucide-react-native";
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
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

const CURRENT_USER_ID = "me";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupInfo {
  id: string;
  name: string;
  avatar_url?: string;
  member_count: number;
}

interface GroupMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  content: string;
  created_at: string;
}

export interface GroupChatPageProps {
  group: GroupInfo;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock Messages
// ---------------------------------------------------------------------------

function minutesAgo(min: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - min);
  return d.toISOString();
}

const MOCK_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: "gm-1",
    sender_id: "usr-201",
    sender_name: "Alex Rivera",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=AlexRivera",
    content: "Hey everyone! Are we still meeting at Zilker this Saturday?",
    created_at: minutesAgo(120),
  },
  {
    id: "gm-2",
    sender_id: "usr-202",
    sender_name: "Sam Nakamura",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=SamNakamura",
    content: "Yes! I'll be there around 9am. Bringing snacks for everyone.",
    created_at: minutesAgo(95),
  },
  {
    id: "gm-3",
    sender_id: CURRENT_USER_ID,
    sender_name: "Maya Chen",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=MayaChen",
    content: "Count me in! Should I bring anything?",
    created_at: minutesAgo(80),
  },
  {
    id: "gm-4",
    sender_id: "usr-201",
    sender_name: "Alex Rivera",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=AlexRivera",
    content: "Just bring yourselves and good vibes! I've got water and trail mix covered.",
    created_at: minutesAgo(60),
  },
  {
    id: "gm-5",
    sender_id: "usr-203",
    sender_name: "Jordan Lee",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=JordanLee",
    content: "I'll be a little late but definitely coming. Parking at the south entrance.",
    created_at: minutesAgo(30),
  },
  {
    id: "gm-6",
    sender_id: "usr-202",
    sender_name: "Sam Nakamura",
    sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=SamNakamura",
    content: "Perfect! See you all there. The weather looks amazing for it.",
    created_at: minutesAgo(10),
  },
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function GroupMessageBubble({ message }: { message: GroupMessage }) {
  const isSent = message.sender_id === CURRENT_USER_ID;

  return (
    <View style={[s.bubbleWrapper, isSent ? s.bubbleWrapperSent : s.bubbleWrapperReceived]}>
      {!isSent && (
        <Avatar size="sm" src={message.sender_avatar} name={message.sender_name} />
      )}
      <View style={s.bubbleContent}>
        {!isSent && (
          <Text style={s.bubbleSenderName}>{message.sender_name}</Text>
        )}
        <View style={[s.bubble, isSent ? s.bubbleSent : s.bubbleReceived]}>
          <Text style={[s.bubbleText, isSent ? s.bubbleTextSent : s.bubbleTextReceived]}>
            {message.content}
          </Text>
        </View>
        <Text style={[s.bubbleTime, isSent && s.bubbleTimeSent]}>
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupChatPage({ group, onClose }: GroupChatPageProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<GroupMessage[]>(MOCK_GROUP_MESSAGES);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Slide-in animation
  const translateX = useSharedValue(SCREEN_WIDTH);

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
          if (finished) runOnJS(onClose)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

  // Sorted messages (newest first for inverted list)
  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [messages],
  );

  // Send message
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: GroupMessage = {
      id: `gm-new-${Date.now()}`,
      sender_id: CURRENT_USER_ID,
      sender_name: "Maya Chen",
      sender_avatar: "https://api.dicebear.com/8.x/avataaars/png?seed=MayaChen",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
  }, [inputText]);

  const renderItem = useCallback(
    ({ item }: { item: GroupMessage }) => <GroupMessageBubble message={item} />,
    [],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.flex}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={[s.header, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              style={s.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={COLORS.primary} />
            </Pressable>

            <View style={s.headerCenter}>
              <Avatar size="sm" src={group.avatar_url} name={group.name} />
              <View>
                <Text style={s.headerName} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={s.headerSubtitle}>
                  {group.member_count} members
                </Text>
              </View>
            </View>

            <Pressable
              hitSlop={8}
              style={s.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Group settings"
            >
              <Settings size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Message List */}
          <FlatList
            ref={flatListRef}
            data={sortedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
          />

          {/* Input Area */}
          <View style={[s.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              style={s.textInput}
              multiline
              maxLength={1000}
            />
            {inputText.trim().length > 0 && (
              <Pressable
                onPress={handleSend}
                style={s.sendButton}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <ArrowUp size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </GestureDetector>
  );
}

GroupChatPage.displayName = "GroupChatPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
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
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

  // Messages
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleWrapper: {
    flexDirection: "row",
    marginVertical: 4,
    gap: 8,
    maxWidth: "85%",
  },
  bubbleWrapperSent: {
    alignSelf: "flex-end",
  },
  bubbleWrapperReceived: {
    alignSelf: "flex-start",
  },
  bubbleContent: {
    flex: 1,
  },
  bubbleSenderName: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.secondary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSent: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
  },
  bubbleReceived: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  bubbleTextSent: {
    color: "#FFFFFF",
  },
  bubbleTextReceived: {
    color: "#111827",
  },
  bubbleTime: {
    fontSize: 10,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    marginLeft: 4,
  },
  bubbleTimeSent: {
    textAlign: "right",
    marginRight: 4,
    marginLeft: 0,
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
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
