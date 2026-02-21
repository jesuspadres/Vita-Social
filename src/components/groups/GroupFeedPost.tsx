import React, { useState, useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Heart, MessageCircle } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import type { MockGroupPost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupFeedPostProps {
  post: MockGroupPost;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupFeedPost({ post }: GroupFeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const heartScale = useSharedValue(1);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Bounce animation
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
        <Pressable onPress={handleLike} style={styles.footerAction} hitSlop={12}>
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

GroupFeedPost.displayName = "GroupFeedPost";

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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingVertical: 4,
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
