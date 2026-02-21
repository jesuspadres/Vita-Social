import React, { useState, useCallback } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import {
  Heart,
  MessageCircle,
  MapPin,
  Repeat2,
  Calendar,
  Users,
} from "lucide-react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import { COLORS } from "@/lib/constants";
import type { MockProfilePost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfilePostCardProps {
  post: MockProfilePost;
  index: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfilePostCard({ post, index }: ProfilePostCardProps) {
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
    <Animated.View entering={FadeInUp.duration(400).delay(index * 80)}>
      <View style={styles.container}>
        {/* ── Check-in badge ── */}
        {post.type === "checkin" && post.checkin && (
          <View style={styles.checkinBadge}>
            <MapPin size={12} color={COLORS.success} />
            <Text style={styles.checkinBadgeText}>
              Checked in at {post.checkin.locationName}
            </Text>
          </View>
        )}

        {/* ── Highlight indicator ── */}
        {post.type === "highlight" && (
          <View style={styles.highlightBadge}>
            <Repeat2 size={14} color={COLORS.secondary} />
            <Text style={styles.highlightBadgeText}>Maya shared</Text>
          </View>
        )}

        {/* ── Content text ── */}
        <Text style={styles.content}>{post.content}</Text>

        {/* ── Check-in event info ── */}
        {post.type === "checkin" && post.checkin && (
          <View style={styles.checkinInfo}>
            <View style={styles.checkinEventRow}>
              <Calendar size={14} color={COLORS.secondary} />
              <Text style={styles.checkinEventTitle}>
                {post.checkin.eventTitle}
              </Text>
            </View>
            {post.checkin.groupName && (
              <View style={styles.checkinGroupPill}>
                <Text style={styles.checkinGroupText}>
                  {post.checkin.groupName}
                </Text>
              </View>
            )}
            {post.checkin.attendeeCount != null && (
              <View style={styles.checkinAttendeeRow}>
                <Users size={12} color="#9CA3AF" />
                <Text style={styles.checkinAttendeeText}>
                  {post.checkin.attendeeCount} attended
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Post image ── */}
        {post.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* ── Highlight embedded card ── */}
        {post.type === "highlight" && post.highlight && (
          <View style={styles.highlightCard}>
            <View style={styles.highlightHeader}>
              <Avatar
                size="sm"
                src={post.highlight.originalPost.userAvatar}
                name={post.highlight.originalPost.userName}
              />
              <View style={styles.highlightHeaderInfo}>
                <Text style={styles.highlightUserName}>
                  {post.highlight.originalPost.userName}
                </Text>
                {post.highlight.originalPost.groupName && (
                  <Text style={styles.highlightGroupText}>
                    in {post.highlight.originalPost.groupName}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.highlightContent} numberOfLines={3}>
              {post.highlight.originalPost.content}
            </Text>
            {post.highlight.originalPost.image && (
              <View style={styles.highlightImageContainer}>
                <Image
                  source={{ uri: post.highlight.originalPost.image }}
                  style={styles.highlightImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleLike}
            style={styles.footerAction}
            hitSlop={8}
          >
            <Animated.View style={heartAnimatedStyle}>
              <Heart
                size={18}
                color={isLiked ? COLORS.danger : "#6B7280"}
                fill={isLiked ? COLORS.danger : "none"}
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

          <View style={styles.footerSpacer} />

          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

ProfilePostCard.displayName = "ProfilePostCard";

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

  // Check-in badge
  checkinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    backgroundColor: "rgba(56, 161, 105, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  checkinBadgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: "Inter_500Medium",
  },

  // Highlight badge
  highlightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  highlightBadgeText: {
    fontSize: 12,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },

  // Content
  content: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },

  // Check-in event info
  checkinInfo: {
    marginBottom: 10,
    gap: 6,
  },
  checkinEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkinEventTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  checkinGroupPill: {
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  checkinGroupText: {
    fontSize: 11,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  checkinAttendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkinAttendeeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },

  // Image
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
  },

  // Highlight embedded card
  highlightCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 2,
    borderLeftColor: COLORS.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  highlightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  highlightHeaderInfo: {
    flex: 1,
  },
  highlightUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
  },
  highlightGroupText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
  highlightContent: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  highlightImageContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  highlightImage: {
    width: "100%",
    height: 120,
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
    color: COLORS.danger,
  },
  footerSpacer: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
  },
});
