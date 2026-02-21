import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, MessageCircle, Share2, Send } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostAuthor {
  name: string;
  avatar_url: string;
}

interface PostData {
  id: string;
  author: PostAuthor;
  body: string;
  image_url?: string;
  likes: number;
  comments: number;
  created_at: string;
}

interface Comment {
  id: string;
  author: { name: string; avatar_url: string };
  text: string;
  created_at: string;
}

export interface GroupPostDetailProps {
  post: PostData;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock Comments
// ---------------------------------------------------------------------------

const MOCK_COMMENTS: Comment[] = [
  {
    id: "cmt-1",
    author: {
      name: "Alex Rivera",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=AlexRivera",
    },
    text: "This is so cool! I was there last week and the vibes were incredible.",
    created_at: "2h ago",
  },
  {
    id: "cmt-2",
    author: {
      name: "Sam Nakamura",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=SamNakamura",
    },
    text: "Count me in for next time! Anyone want to carpool?",
    created_at: "1h ago",
  },
  {
    id: "cmt-3",
    author: {
      name: "Jordan Lee",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=JordanLee",
    },
    text: "Great photo! What camera do you use?",
    created_at: "45m ago",
  },
  {
    id: "cmt-4",
    author: {
      name: "Priya Patel",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=PriyaPatel",
    },
    text: "Love this group! Always the best events.",
    created_at: "20m ago",
  },
];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function CommentRow({ comment }: { comment: Comment }) {
  return (
    <View style={s.commentRow}>
      <Avatar size="sm" src={comment.author.avatar_url} name={comment.author.name} />
      <View style={s.commentBody}>
        <View style={s.commentHeaderRow}>
          <Text style={s.commentAuthor}>{comment.author.name}</Text>
          <Text style={s.commentTime}>{comment.created_at}</Text>
        </View>
        <Text style={s.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupPostDetail({ post, onClose }: GroupPostDetailProps) {
  const insets = useSafeAreaInsets();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);

  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

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

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    heartScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 150 }),
    );
    setIsLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  }, [heartScale]);

  const handleSendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text) return;

    const newComment: Comment = {
      id: `cmt-new-${Date.now()}`,
      author: {
        name: "Maya Chen",
        avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=MayaChen",
      },
      text,
      created_at: "Just now",
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  }, [commentText]);

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => <CommentRow comment={item} />,
    [],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        {/* Post Content */}
        <View style={s.postContainer}>
          {/* Author Row */}
          <View style={s.authorRow}>
            <Avatar size="md" src={post.author.avatar_url} name={post.author.name} />
            <View style={s.authorInfo}>
              <Text style={s.authorName}>{post.author.name}</Text>
              <Text style={s.postTimestamp}>{post.created_at}</Text>
            </View>
          </View>

          {/* Body */}
          <Text style={s.postBody}>{post.body}</Text>

          {/* Optional Image */}
          {post.image_url && (
            <View style={s.postImageContainer}>
              <Image
                source={{ uri: post.image_url }}
                style={s.postImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Interaction Bar */}
          <View style={s.interactionBar}>
            <Pressable onPress={handleLike} style={s.interactionBtn} hitSlop={12}>
              <Animated.View style={heartAnimatedStyle}>
                <Heart
                  size={20}
                  color={isLiked ? COLORS.danger : "#6B7280"}
                  fill={isLiked ? COLORS.danger : "none"}
                />
              </Animated.View>
              <Text style={[s.interactionCount, isLiked && s.interactionCountActive]}>
                {likeCount}
              </Text>
            </Pressable>

            <View style={s.interactionBtn}>
              <MessageCircle size={20} color="#6B7280" />
              <Text style={s.interactionCount}>{comments.length}</Text>
            </View>

            <Pressable style={s.interactionBtn} hitSlop={12}>
              <Share2 size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Comments Section Header */}
        <SectionHeader title="COMMENTS" />
      </View>
    ),
    [post, isLiked, likeCount, comments.length, handleLike, heartAnimatedStyle],
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
              style={s.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={s.headerTitle}>Post</Text>
            <View style={s.headerSpacer} />
          </View>

          {/* Comments List (with post as header) */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            ListHeaderComponent={ListHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
          />

          {/* Comment Input */}
          <View style={[s.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#9CA3AF"
              style={s.textInput}
              multiline
              maxLength={500}
            />
            {commentText.trim().length > 0 && (
              <Pressable
                onPress={handleSendComment}
                style={s.sendButton}
                accessibilityRole="button"
                accessibilityLabel="Send comment"
              >
                <Send size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </GestureDetector>
  );
}

GroupPostDetail.displayName = "GroupPostDetail";

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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },

  // Post
  postContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  postTimestamp: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
  },
  postImageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 220,
  },

  // Interaction Bar
  interactionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingTop: 4,
  },
  interactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 4,
  },
  interactionCount: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  interactionCountActive: {
    color: COLORS.danger,
  },

  // Section Header
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 20,
    fontFamily: "Inter_700Bold",
  },

  // Comments
  listContent: {
    paddingBottom: 16,
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  commentTime: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  commentText: {
    fontSize: 13,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
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
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter_400Regular",
    maxHeight: 80,
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
