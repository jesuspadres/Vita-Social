import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ArrowLeft, Lock, BadgeCheck } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

const COLUMN_GAP = 12;
const PADDING_H = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * (4 / 3);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LikesYouScreenProps {
  onClose: () => void;
  isPremium?: boolean;
}

interface LikeUser {
  id: string;
  name: string;
  age: number;
  avatar: string;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const LIKES_YOU_USERS: LikeUser[] = [
  { id: "like-1", name: "Sofia", age: 26, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sofia26", verified: true },
  { id: "like-2", name: "Elena", age: 24, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena24", verified: false },
  { id: "like-3", name: "Marcus", age: 29, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus29", verified: true },
  { id: "like-4", name: "Amara", age: 27, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Amara27", verified: false },
  { id: "like-5", name: "Kai", age: 31, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Kai31", verified: true },
  { id: "like-6", name: "Luna", age: 25, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Luna25", verified: false },
  { id: "like-7", name: "River", age: 28, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=River28", verified: false },
  { id: "like-8", name: "Zara", age: 23, avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Zara23", verified: true },
];

// ---------------------------------------------------------------------------
// LikeCard Sub-component
// ---------------------------------------------------------------------------

function LikeCard({
  user,
  isPremium,
}: {
  user: LikeUser;
  isPremium: boolean;
}) {
  const handlePress = useCallback(() => {
    console.log("[LikesYouScreen] Tapped user:", user.id, user.name);
  }, [user.id, user.name]);

  return (
    <Pressable onPress={handlePress} style={s.card}>
      {/* User photo */}
      <Image
        source={{ uri: user.avatar }}
        style={s.cardImage}
        resizeMode="cover"
      />

      {/* Name + age overlay with gradient */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={s.cardGradient}
      >
        <View style={s.cardInfoRow}>
          <Text style={s.cardName} numberOfLines={1}>
            {user.name}, {user.age}
          </Text>
          {user.verified && (
            <BadgeCheck size={14} color={COLORS.blueBadge} fill="#FFFFFF" />
          )}
        </View>
      </LinearGradient>

      {/* Gold blur overlay for non-premium users */}
      {!isPremium && (
        <View style={s.blurOverlayContainer}>
          <BlurView intensity={24} tint="light" style={s.blurView} />
          <View style={s.blurContent}>
            <View style={s.lockCircle}>
              <Lock size={20} color={COLORS.goldBadge} />
            </View>
            <Text style={s.upgradeText}>Upgrade to Gold</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LikesYouScreen({ onClose, isPremium = false }: LikesYouScreenProps) {
  const insets = useSafeAreaInsets();
  const premium = isPremium;

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
        <View style={[s.root, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={s.header}>
            <Pressable
              onPress={handleClose}
              style={s.backBtn}
              hitSlop={8}
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>

            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Likes You</Text>
              <View style={s.countPill}>
                <Text style={s.countPillText}>{LIKES_YOU_USERS.length}</Text>
              </View>
            </View>

            {/* Right spacer to balance back button */}
            <View style={{ width: 44 }} />
          </View>

          {/* Grid */}
          <FlatList
            data={LIKES_YOU_USERS}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={s.row}
            contentContainerStyle={[
              s.grid,
              { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <LikeCard user={item} isPremium={premium} />
            )}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

LikesYouScreen.displayName = "LikesYouScreen";

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
    backgroundColor: "#F7FAFC",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  countPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  countPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  // Grid
  grid: {
    paddingHorizontal: PADDING_H,
    paddingTop: 16,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 40,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Blur overlay (non-premium)
  blurOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: "hidden",
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  blurContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    gap: 8,
  },
  lockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.goldBadge,
    fontFamily: "Inter_600SemiBold",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
