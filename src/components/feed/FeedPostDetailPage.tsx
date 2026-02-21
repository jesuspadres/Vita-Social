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
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Send,
  MoreVertical,
} from "lucide-react-native";
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
import { CURRENT_USER_PROFILE, type MockFeedPost, type MockProfilePost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Comment {
  id: string;
  author: { name: string; avatar_url: string };
  text: string;
  created_at: string;
}

export interface FeedPostDetailPageProps {
  post: MockFeedPost | MockProfilePost;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Mock Comments
// ---------------------------------------------------------------------------

const MOCK_COMMENTS: Comment[] = [
  {
    id: "fc-1",
    author: {
      name: "Alex Rivera",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=AlexRivera",
    },
    text: "This is so cool! I was there last week and the vibes were incredible.",
    created_at: "2h ago",
  },
  {
    id: "fc-2",
    author: {
      name: "Sam Nakamura",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=SamNakamura",
    },
    text: "Count me in for next time! Anyone want to carpool?",
    created_at: "1h ago",
  },
  {
    id: "fc-3",
    author: {
      name: "Jordan Lee",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=JordanLee",
    },
    text: "Great photo! What camera do you use?",
    created_at: "45m ago",
  },
  {
    id: "fc-4",
    author: {
      name: "Priya Patel",
      avatar_url: "https://api.dicebear.com/8.x/avataaars/png?seed=PriyaPatel",
    },
    text: "Love this! Always the best content on my feed.",
    created_at: "20m ago",
  },
  {
    id: "fc-5",
    author: {
      name: "Marcus Johnson",
      avatar_url:
        "https://api.dicebear.com/8.x/avataaars/png?seed=MarcusJohnson",
    },
    text: "Totally agree, we need more meetups like this.",
    created_at: "10m ago",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isFeedPost(post: MockFeedPost | MockProfilePost): post is MockFeedPost {
  return "user" in post && "source" in post;
}

function getAuthorInfo(post: MockFeedPost | MockProfilePost) {
  if (isFeedPost(post)) {
    return {
      name: post.user.name,
      avatar: post.user.avatar,
      online: post.user.online,
    };
  }
  return {
    name: `${CURRENT_USER_PROFILE.firstName} ${CURRENT_USER_PROFILE.lastName}`,
    avatar: CURRENT_USER_PROFILE.avatarUrl,
    online: true,
  };
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

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

export function FeedPostDetailPage({ post, onClose }: FeedPostDetailPageProps) {
  const insets = useSafeAreaInsets();
  const [isLiked, setIsLiked] = useState(post.liked);
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
      id: `fc-new-${Date.now()}`,
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

  const author = getAuthorInfo(post);

  const ListHeader = useCallback(
    () => (
      <View>
        {/* Post Content */}
        <View style={s.postContainer}>
          {/* Author Row */}
          <View style={s.authorRow}>
            <Avatar
              size="md"
              src={author.avatar}
              name={author.name}
              online={author.online}
            />
            <View style={s.authorInfo}>
              <Text style={s.authorName}>{author.name}</Text>
              <Text style={s.postTimestamp}>{post.timestamp}</Text>
            </View>
            <Pressable style={s.moreButton} hitSlop={8}>
              <MoreVertical size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Body */}
          <Text style={s.postBody}>{post.content}</Text>

          {/* Optional Image */}
          {post.image && (
            <View style={s.postImageContainer}>
              <Image
                source={{ uri: post.image }}
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
              <MessageSquare size={20} color="#6B7280" />
              <Text style={s.interactionCount}>{comments.length}</Text>
            </View>

            <Pressable style={s.interactionBtn} hitSlop={12}>
              <Share2 size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Comments Section Header */}
        <View style={s.commentsHeaderRow}>
          <Text style={s.commentsHeaderText}>Comments</Text>
          <Text style={s.commentsHeaderCount}>{comments.length}</Text>
        </View>
      </View>
    ),
    [post, author, isLiked, likeCount, comments.length, handleLike, heartAnimatedStyle],
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
            <Pressable
              onPress={handleSendComment}
              style={[
                s.sendButton,
                !commentText.trim() && s.sendButtonDisabled,
              ]}
              disabled={!commentText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send comment"
            >
              <Send size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </GestureDetector>
  );
}

FeedPostDetailPage.displayName = "FeedPostDetailPage";

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
    fontSize: 14,
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
  moreButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },

  // Comments Section Header
  commentsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  commentsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
  },
  commentsHeaderCount: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
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
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
