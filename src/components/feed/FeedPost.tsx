import React, { useState, useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Heart, MessageCircle, Sparkles } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import type { MockFeedPost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedPostProps {
  post: MockFeedPost;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

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

  return (
    <View style={styles.container}>
      {/* Source Indicator */}
      {post.source.type === "group" && (
        <View style={styles.sourceBadge}>
          <View style={styles.groupPill}>
            <Text style={styles.groupPillText}>{post.source.groupName}</Text>
          </View>
        </View>
      )}

      {post.source.type === "suggested" && (
        <View style={styles.suggestedContainer}>
          <Sparkles size={14} color="#D69E2E" />
          <Text style={styles.suggestedText}>Suggested for you</Text>
          <Text style={styles.suggestedSeparator}> · </Text>
          <Text style={styles.suggestedGroupText} numberOfLines={1}>
            {post.source.groupName}
          </Text>
        </View>
      )}

      {/* Header: Avatar + Name + Timestamp */}
      <View style={styles.header}>
        <Avatar
          size="sm"
          src={post.user.avatar}
          name={post.user.name}
          online={post.user.online}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{post.user.name}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Optional Image */}
      {post.image && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Footer: Likes + Comments */}
      <View style={styles.footer}>
        <Pressable onPress={handleLike} style={styles.footerAction} hitSlop={8}>
          <Animated.View style={heartAnimatedStyle}>
            <Heart
              size={18}
              color={isLiked ? "#E53E3E" : "#6B7280"}
              fill={isLiked ? "#E53E3E" : "none"}
            />
          </Animated.View>
          <Text
            style={[styles.footerCount, isLiked && styles.footerCountActive]}
          >
            {likeCount}
          </Text>
        </Pressable>

        <View style={styles.footerAction}>
          <MessageCircle size={18} color="#6B7280" />
          <Text style={styles.footerCount}>{post.comments}</Text>
        </View>
      </View>
    </View>
  );
}

FeedPost.displayName = "FeedPost";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },

  // Source indicators
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  groupPill: {
    backgroundColor: "#F0F4F8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  groupPillText: {
    fontSize: 12,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  suggestedContainer: {
    backgroundColor: "#FFFDF5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  suggestedText: {
    fontSize: 11,
    color: "#D69E2E",
    fontFamily: "Inter_500Medium",
    marginLeft: 4,
  },
  suggestedSeparator: {
    fontSize: 11,
    color: "#D69E2E",
  },
  suggestedGroupText: {
    fontSize: 11,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  // Content
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerCount: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter_500Medium",
  },
  footerCountActive: {
    color: "#E53E3E",
  },
});
