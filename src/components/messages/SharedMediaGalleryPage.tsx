import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
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
import {
  ArrowLeft,
  Camera,
  Link as LinkIcon,
  Globe,
  ExternalLink,
} from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;
const PHOTO_GAP = 2;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - PHOTO_GAP * (NUM_COLUMNS - 1) - 32) / NUM_COLUMNS;

type MediaTab = "photos" | "links";

export interface SharedMediaGalleryPageProps {
  onClose: () => void;
  userName: string;
  initialTab?: MediaTab;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

interface MockPhoto {
  id: string;
  uri: string;
}

interface MockLink {
  id: string;
  title: string;
  domain: string;
  url: string;
}

const MOCK_PHOTOS: MockPhoto[] = Array.from({ length: 9 }, (_, i) => ({
  id: `photo-${i + 1}`,
  uri: `https://picsum.photos/seed/photo${i + 1}/200/200`,
}));

const MOCK_LINKS: MockLink[] = [
  {
    id: "link-1",
    title: "Best Coffee Shops in the City",
    domain: "medium.com",
    url: "https://medium.com/best-coffee-shops",
  },
  {
    id: "link-2",
    title: "Weekend Hiking Trails Guide",
    domain: "alltrails.com",
    url: "https://alltrails.com/hiking-trails",
  },
  {
    id: "link-3",
    title: "Live Music Events This Week",
    domain: "eventbrite.com",
    url: "https://eventbrite.com/live-music",
  },
  {
    id: "link-4",
    title: "New Restaurant Opening Downtown",
    domain: "eater.com",
    url: "https://eater.com/new-restaurant",
  },
];

// ---------------------------------------------------------------------------
// Photo Item
// ---------------------------------------------------------------------------

function PhotoItem({ item }: { item: MockPhoto }) {
  return (
    <Pressable
      style={s.photoItem}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel="Shared photo"
    >
      <Image
        source={{ uri: item.uri }}
        style={s.photoImage}
        resizeMode="cover"
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Link Item
// ---------------------------------------------------------------------------

function LinkItem({ item }: { item: MockLink }) {
  return (
    <Pressable
      style={({ pressed }) => [s.linkItem, pressed && { backgroundColor: "#F7FAFC" }]}
      accessible={true}
      accessibilityRole="link"
      accessibilityLabel={item.title}
    >
      <View style={s.linkIconCircle}>
        <Globe size={16} color={COLORS.secondary} strokeWidth={1.75} />
      </View>
      <View style={s.linkTextCol}>
        <Text style={s.linkTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={s.linkDomain} numberOfLines={1}>
          {item.domain}
        </Text>
      </View>
      <ExternalLink size={16} color="#CBD5E0" strokeWidth={1.75} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ tab }: { tab: MediaTab }) {
  const isPhotos = tab === "photos";
  const IconComponent = isPhotos ? Camera : LinkIcon;
  return (
    <View style={s.emptyContainer}>
      <View style={s.emptyIconCircle}>
        <IconComponent size={28} color={COLORS.secondary} strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>
        {isPhotos ? "No shared photos yet" : "No shared links yet"}
      </Text>
      <Text style={s.emptyDesc}>
        {isPhotos
          ? "Photos shared in this conversation will appear here"
          : "Links shared in this conversation will appear here"}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SharedMediaGalleryPage({
  onClose,
  userName,
  initialTab = "photos",
}: SharedMediaGalleryPageProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab);

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

  // Render callbacks
  const renderPhoto = useCallback(
    ({ item }: { item: MockPhoto }) => <PhotoItem item={item} />,
    [],
  );

  const renderLink = useCallback(
    ({ item }: { item: MockLink }) => <LinkItem item={item} />,
    [],
  );

  const photoKeyExtractor = useCallback((item: MockPhoto) => item.id, []);
  const linkKeyExtractor = useCallback((item: MockLink) => item.id, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[s.overlay, slideStyle]}>
        <View style={s.root}>
          {/* Header */}
          <View style={[s.header, { paddingTop: insets.top + 12 }]}>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              style={s.backBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={s.headerTitle}>Shared Media</Text>
            <View style={s.headerSpacer} />
          </View>

          {/* Tab Bar */}
          <View style={s.tabBar}>
            <Pressable
              style={[s.tabItem, activeTab === "photos" && s.tabItemActive]}
              onPress={() => setActiveTab("photos")}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "photos" }}
              accessibilityLabel="Photos tab"
            >
              <Text
                style={[
                  s.tabText,
                  activeTab === "photos" ? s.tabTextActive : s.tabTextInactive,
                ]}
              >
                Photos
              </Text>
            </Pressable>
            <Pressable
              style={[s.tabItem, activeTab === "links" && s.tabItemActive]}
              onPress={() => setActiveTab("links")}
              accessible={true}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "links" }}
              accessibilityLabel="Links tab"
            >
              <Text
                style={[
                  s.tabText,
                  activeTab === "links" ? s.tabTextActive : s.tabTextInactive,
                ]}
              >
                Links
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          {activeTab === "photos" ? (
            MOCK_PHOTOS.length > 0 ? (
              <FlatList
                data={MOCK_PHOTOS}
                renderItem={renderPhoto}
                keyExtractor={photoKeyExtractor}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={s.photoRow}
                contentContainerStyle={[
                  s.photoListContent,
                  { paddingBottom: insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <EmptyState tab="photos" />
            )
          ) : MOCK_LINKS.length > 0 ? (
            <FlatList
              data={MOCK_LINKS}
              renderItem={renderLink}
              keyExtractor={linkKeyExtractor}
              contentContainerStyle={[
                s.linkListContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={s.linkDivider} />}
            />
          ) : (
            <EmptyState tab="links" />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

SharedMediaGalleryPage.displayName = "SharedMediaGalleryPage";

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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: COLORS.secondary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  tabTextActive: {
    fontWeight: "700",
    color: COLORS.secondary,
    fontFamily: "Inter_700Bold",
  },
  tabTextInactive: {
    fontWeight: "500",
    color: "#A0AEC0",
  },

  // Photos
  photoListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  photoRow: {
    gap: PHOTO_GAP,
    marginBottom: PHOTO_GAP,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },

  // Links
  linkListContent: {
    paddingTop: 8,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  linkIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  linkTextCol: {
    flex: 1,
    gap: 2,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  linkDomain: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  linkDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 64,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
