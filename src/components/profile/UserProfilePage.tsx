import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
import {
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  MapPin,
  Briefcase,
  AlertTriangle,
  Ban,
  MessageSquare,
  Users,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { ReportSheet } from "@/components/moderation/ReportSheet";
import { BlockConfirmSheet } from "@/components/moderation/BlockConfirmSheet";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.05;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

const CHIP_COLORS = [
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  "#3182CE", // info
  COLORS.danger,
] as const;

const VERIFICATION_COLORS: Record<string, string> = {
  green: COLORS.success,
  blue: "#3182CE",
  gold: "#D4AF37",
  photo: "#3182CE",
  id: COLORS.success,
};

export interface UserProfileUser {
  id: string;
  first_name: string;
  avatar_url: string;
  age?: number;
  bio?: string;
  interests?: string[];
  photos?: string[];
  verification_level?: string;
  online?: boolean;
  location?: string;
  occupation?: string;
}

export interface UserProfilePageProps {
  user: UserProfileUser;
  onClose: () => void;
  onMessage?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserProfilePage({ user, onClose, onMessage }: UserProfilePageProps) {
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photoListRef = useRef<FlatList>(null);

  const photos =
    user.photos && user.photos.length > 0 ? user.photos : [user.avatar_url];

  const badgeColor = user.verification_level
    ? VERIFICATION_COLORS[user.verification_level]
    : undefined;

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

  const handleClose = useCallback(() => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
    setTimeout(onClose, 260);
  }, [translateX, onClose]);

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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        <View style={s.root}>
          {/* Scrollable content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 80 },
            ]}
            showsVerticalScrollIndicator={false}
            bounces
          >
            {/* ── Photo Gallery ── */}
            <View style={s.galleryWrapper}>
              <FlatList
                ref={photoListRef}
                data={photos}
                keyExtractor={(_, i) => `photo-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                  );
                  setActivePhotoIndex(idx);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={s.galleryPhoto}
                    resizeMode="cover"
                  />
                )}
              />

              {/* Bottom gradient overlay */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.65)"]}
                style={s.galleryGradient}
                pointerEvents="none"
              />

              {/* Name + Age + Badge overlay */}
              <View style={s.galleryInfo} pointerEvents="box-none">
                <View style={s.galleryNameRow}>
                  <Text style={s.galleryName}>
                    {user.first_name}
                    {user.age ? `, ${user.age}` : ""}
                  </Text>
                  {badgeColor && (
                    <ShieldCheck
                      size={20}
                      color={badgeColor}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              </View>

              {/* Top buttons */}
              <View style={[s.topButtonRow, { top: insets.top + 8 }]}>
                <Pressable
                  onPress={handleClose}
                  style={s.topButton}
                  hitSlop={8}
                >
                  <ArrowLeft size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={() => setShowMenu((p) => !p)}
                  style={s.topButton}
                  hitSlop={8}
                >
                  <MoreVertical size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Dot indicators */}
              {photos.length > 1 && (
                <View style={s.galleryDots}>
                  {photos.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        s.galleryDot,
                        i === activePhotoIndex
                          ? s.galleryDotActive
                          : s.galleryDotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Bio ── */}
            {user.bio ? (
              <View style={s.bioSection}>
                <Text style={s.bioText}>{user.bio}</Text>
              </View>
            ) : null}

            {/* ── Quick Info Pills ── */}
            {(user.location || user.occupation) && (
              <View style={s.quickInfoRow}>
                {user.location && (
                  <View style={s.infoPill}>
                    <MapPin size={14} color="#718096" strokeWidth={1.75} />
                    <Text style={s.infoPillText}>{user.location}</Text>
                  </View>
                )}
                {user.occupation && (
                  <View style={s.infoPill}>
                    <Briefcase size={14} color="#718096" strokeWidth={1.75} />
                    <Text style={s.infoPillText}>{user.occupation}</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Interests ── */}
            {user.interests && user.interests.length > 0 && (
              <View style={s.interestsSection}>
                <Text style={s.sectionHeading}>Interests</Text>
                <View style={s.chipsRow}>
                  {user.interests.map((interest, i) => {
                    const color = CHIP_COLORS[i % CHIP_COLORS.length];
                    return (
                      <View
                        key={interest}
                        style={[s.chip, { backgroundColor: color + "18" }]}
                      >
                        <Text style={[s.chipText, { color }]}>
                          {interest}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Shared Groups ── */}
            <View style={s.sharedGroupsSection}>
              <Text style={s.sectionHeading}>Shared Groups</Text>
              <View style={s.emptyContainer}>
                <View style={s.emptyIconCircle}>
                  <Users size={24} color={COLORS.secondary} />
                </View>
                <Text style={s.emptyText}>No shared groups</Text>
              </View>
            </View>
          </ScrollView>

          {/* ── Menu Backdrop ── */}
          {showMenu && (
            <Pressable
              style={s.menuBackdrop}
              onPress={() => setShowMenu(false)}
            />
          )}

          {/* ── Dropdown Menu ── */}
          {showMenu && (
            <Animated.View
              entering={FadeIn.duration(150)}
              style={[s.menu, { top: insets.top + 60 }]}
            >
              <Pressable
                style={s.menuItem}
                onPress={() => { setShowMenu(false); setShowReport(true); }}
              >
                <AlertTriangle size={16} color="#D69E2E" />
                <Text style={s.menuItemText}>Report</Text>
              </Pressable>
              <Pressable
                style={s.menuItem}
                onPress={() => { setShowMenu(false); setShowBlock(true); }}
              >
                <Ban size={16} color="#E53E3E" />
                <Text style={[s.menuItemText, { color: "#E53E3E" }]}>
                  Block
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Bottom Action Bar ── */}
          <View
            style={[
              s.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {onMessage && (
              <View style={s.messageButtonWrapper}>
                <Button
                  variant="primary"
                  fullWidth
                  iconLeft={<MessageSquare size={16} color="#FFFFFF" />}
                  onPress={onMessage}
                >
                  Message
                </Button>
              </View>
            )}
            <Pressable
              onPress={() => setShowMenu(true)}
              style={s.reportButton}
            >
              <AlertTriangle size={20} color="#A0AEC0" />
            </Pressable>
          </View>
        </View>

        {/* Moderation Sheets */}
        <ReportSheet
          visible={showReport}
          onClose={() => setShowReport(false)}
          userName={user.first_name}
          userId={user.id}
        />
        <BlockConfirmSheet
          visible={showBlock}
          onClose={() => setShowBlock(false)}
          userName={user.first_name}
          userAvatar={user.avatar_url}
          onConfirm={() => { setShowBlock(false); }}
        />
      </Animated.View>
    </GestureDetector>
  );
}

UserProfilePage.displayName = "UserProfilePage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Photo gallery
  galleryWrapper: {
    position: "relative",
  },
  galleryPhoto: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  galleryGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: PHOTO_HEIGHT * 0.4,
  },
  galleryInfo: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  galleryNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  galleryName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  galleryDots: {
    position: "absolute",
    bottom: 62,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  galleryDotActive: {
    backgroundColor: "#FFFFFF",
  },
  galleryDotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  // Top buttons
  topButtonRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bio
  bioSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Quick info pills
  quickInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F7FAFC",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  infoPillText: {
    fontSize: 13,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
  },

  // Interests
  interestsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Shared Groups
  sharedGroupsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

  // Dropdown menu
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 19,
  },
  menu: {
    position: "absolute",
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

  // Bottom action bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  messageButtonWrapper: {
    flex: 2,
  },
  reportButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
