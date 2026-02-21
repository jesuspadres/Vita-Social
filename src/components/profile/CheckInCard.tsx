import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Users, X, Clock, Calendar } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn, SlideInUp } from "react-native-reanimated";
import { COLORS } from "@/lib/constants";
import type { MockProfilePost } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 3 columns: parent has 16px padding each side (32) + 2 gaps of 8px (16) = 48
const THUMB_SIZE = Math.floor((SCREEN_WIDTH - 48) / 3);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CheckInCardProps {
  post: MockProfilePost;
  index: number;
}

// ---------------------------------------------------------------------------
// Expanded Moment Modal
// ---------------------------------------------------------------------------

function CheckInMoment({
  post,
  onClose,
}: {
  post: MockProfilePost;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const checkin = post.checkin!;
  const hasImage = !!post.image;

  return (
    <Animated.View style={styles.modalRoot} entering={FadeIn.duration(200)}>
      <View style={[styles.modalContent, { paddingTop: insets.top }]}>
        {/* Close button — positioned below the safe area */}
        <Pressable
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={12}
        >
          <X size={22} color="#FFFFFF" />
        </Pressable>

        {/* Main photo area */}
        <Animated.View
          style={styles.momentContainer}
          entering={SlideInUp.duration(300)}
        >
          {hasImage ? (
            <Image
              source={{ uri: post.image }}
              style={styles.momentImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              style={styles.momentImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {/* Dark overlay for text readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.6)"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top: Timestamp badge */}
          <View style={styles.momentTop}>
            <View style={styles.timeBadge}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.timeBadgeText}>{post.timestamp}</Text>
            </View>
          </View>

          {/* Bottom: Event info */}
          <View style={styles.momentBottom}>
            <Text style={styles.momentEventTitle}>{checkin.eventTitle}</Text>

            <View style={styles.momentRow}>
              <MapPin size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.momentLocationText}>
                {checkin.locationName}
              </Text>
            </View>

            {checkin.groupName && (
              <View style={styles.momentRow}>
                <Calendar size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.momentGroupText}>
                  {checkin.groupName}
                </Text>
              </View>
            )}

            {checkin.attendeeCount != null && (
              <View style={styles.momentRow}>
                <Users size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.momentAttendeesText}>
                  {checkin.attendeeCount} people were here
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Caption / what they were doing */}
        {post.content ? (
          <Animated.View
            style={styles.captionContainer}
            entering={FadeInUp.duration(400).delay(200)}
          >
            <Text style={styles.captionLabel}>In the moment</Text>
            <Text style={styles.captionText}>{post.content}</Text>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CheckInCard({ post, index }: CheckInCardProps) {
  const [expanded, setExpanded] = useState(false);
  const checkin = post.checkin;
  if (!checkin) return null;

  const hasImage = !!post.image;

  const handleOpen = useCallback(() => setExpanded(true), []);
  const handleClose = useCallback(() => setExpanded(false), []);

  return (
    <View style={styles.thumbWrapper}>
      <Animated.View entering={FadeInUp.duration(400).delay(index * 80)}>
        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [
            styles.thumb,
            pressed && styles.thumbPressed,
          ]}
        >
          {/* Image or colored placeholder */}
          {hasImage ? (
            <Image
              source={{ uri: post.image }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {/* Overlay gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.65)"]}
            style={styles.thumbOverlay}
          />

          {/* Info overlay */}
          <View style={styles.thumbInfo}>
            <Text style={styles.thumbTitle} numberOfLines={1}>
              {checkin.eventTitle}
            </Text>
            <Text style={styles.thumbTime}>{post.timestamp}</Text>
          </View>

          {/* Green check-in dot */}
          <View style={styles.thumbDot} />
        </Pressable>
      </Animated.View>

      {/* BeReal-style expanded moment */}
      <Modal
        visible={expanded}
        animationType="none"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <CheckInMoment post={post} onClose={handleClose} />
      </Modal>
    </View>
  );
}

CheckInCard.displayName = "CheckInCard";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Wrapper gives the grid parent a single fixed-size child
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.3,
  },
  // Compact thumbnail
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.3,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  thumbPressed: {
    opacity: 0.85,
  },
  thumbOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },
  thumbInfo: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
  },
  thumbTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  thumbTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  thumbDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  // Modal
  modalRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  // Moment photo
  momentContainer: {
    marginHorizontal: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  momentImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },

  // Top overlay
  momentTop: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timeBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
  },

  // Bottom overlay
  momentBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  momentEventTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  momentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  momentLocationText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
  },
  momentGroupText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
  },
  momentAttendeesText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },

  // Caption
  captionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  captionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  captionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
  },
});
