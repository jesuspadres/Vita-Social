import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Heart,
  Users,
  Calendar,
  Settings,
  Bell,
  MapPin,
  FileText,
  ShieldCheck,
  Search,
} from "lucide-react-native";
import { Card } from "@/components/ui/card";
import { HealthRing } from "@/components/ui/health-ring";
import {
  CURRENT_USER_PROFILE,
  CURRENT_USER_PROFILE_POSTS,
  CURRENT_USER_CHECKINS,
  type MockProfilePost,
} from "@/lib/mock-data";
import { COLORS } from "@/lib/constants";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { VerificationCard } from "@/components/profile/VerificationCard";
import { SettingsPage } from "@/components/profile/SettingsPage";
import { GoldUpsell } from "@/components/profile/GoldUpsell";
import { MyConnectionsPage } from "@/components/profile/MyConnectionsPage";
import { MyGroupsPage } from "@/components/profile/MyGroupsPage";
import { MyEventsPage } from "@/components/profile/MyEventsPage";
import {
  ProfileTabBar,
  type ProfileTab,
} from "@/components/profile/ProfileTabBar";
import { ProfilePostCard } from "@/components/profile/ProfilePostCard";
import { FeedPostDetailPage } from "@/components/feed/FeedPostDetailPage";
import { CheckInCard } from "@/components/profile/CheckInCard";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { HealthRingDetailPage } from "@/components/profile/HealthRingDetailPage";
import { GoldSubscriptionPage } from "@/components/profile/GoldSubscriptionPage";
import { GlobalSearchPage } from "@/components/search/GlobalSearchPage";
import { VerificationFlowPage } from "@/components/profile/VerificationFlowPage";
import type { VerificationFlowTier } from "@/components/profile/VerificationFlowPage";
import type { VerificationTier } from "@/components/profile/VerificationCard";

// ---------------------------------------------------------------------------
// Interest chip color cycling
// ---------------------------------------------------------------------------

const CHIP_COLORS = [
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  "#3182CE", // info
  COLORS.danger,
] as const;

const { width: STATIC_WIDTH } = Dimensions.get("window");
const PHOTO_HEIGHT = STATIC_WIDTH * 1.05;
const MIN_TAB_CONTENT_HEIGHT = Dimensions.get("window").height * 0.5;
const TAB_COUNT = 3;

const TAB_KEYS: ProfileTab[] = ["posts", "checkins", "about"];

const VERIFICATION_COLORS: Record<string, string> = {
  green: COLORS.success,
  blue: "#3182CE",
  gold: "#D4AF37",
};

// ---------------------------------------------------------------------------
// Mini group card for horizontal list
// ---------------------------------------------------------------------------

interface MiniGroupItem {
  id: string;
  name: string;
  daysElapsed: number;
  memberCount: number;
}

function MiniGroupCard({ item }: { item: MiniGroupItem }) {
  return (
    <Card variant="outlined" className="mr-3 p-3" style={s.miniGroupCard}>
      <View style={s.miniGroupRing}>
        <HealthRing daysElapsed={item.daysElapsed} size={44} strokeWidth={3} />
      </View>
      <Text
        style={s.miniGroupName}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
      <Text style={s.miniGroupMembers}>{item.memberCount} members</Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Profile Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { width: SCREEN_W } = useWindowDimensions();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHealthRing, setShowHealthRing] = useState(false);
  const [showGoldSubscription, setShowGoldSubscription] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationTier, setVerificationTier] = useState<VerificationFlowTier>("blue");
  const [selectedPost, setSelectedPost] = useState<MockProfilePost | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photoListRef = useRef<FlatList>(null);

  const profile = CURRENT_USER_PROFILE;
  const photos =
    profile.photos.length > 0 ? profile.photos : [profile.avatarUrl];
  const badgeColor = VERIFICATION_COLORS[profile.verificationLevel];

  // Shared values for horizontal tab pager
  const pagerTranslateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const pagerContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pagerTranslateX.value }],
  }));

  const setTabWithHaptic = useCallback((key: ProfileTab) => {
    setActiveTab(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleTabChange = useCallback(
    (tab: ProfileTab) => {
      setActiveTab(tab);
    },
    [],
  );

  const handleGoldTrial = useCallback(() => {
    setShowGoldSubscription(true);
  }, []);

  const handleVerificationUpgrade = useCallback((nextTier: VerificationTier) => {
    if (nextTier === "blue" || nextTier === "green" || nextTier === "gold") {
      setVerificationTier(nextTier);
    } else {
      setVerificationTier("blue");
    }
    setShowVerification(true);
  }, []);

  // Pan gesture for swiping between tabs
  const tabSwipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      contextX.value = pagerTranslateX.value;
    })
    .onUpdate((e) => {
      const newX = contextX.value + e.translationX;
      const maxX = 0;
      const minX = -(TAB_COUNT - 1) * SCREEN_W;
      if (newX > maxX) {
        pagerTranslateX.value = maxX + (newX - maxX) * 0.3;
      } else if (newX < minX) {
        pagerTranslateX.value = minX + (newX - minX) * 0.3;
      } else {
        pagerTranslateX.value = newX;
      }
    })
    .onEnd((e) => {
      const currentPage = -pagerTranslateX.value / SCREEN_W;
      let targetPage: number;
      if (Math.abs(e.velocityX) > 500) {
        targetPage =
          e.velocityX > 0 ? Math.floor(currentPage) : Math.ceil(currentPage);
      } else {
        targetPage = Math.round(currentPage);
      }
      targetPage = Math.max(0, Math.min(TAB_COUNT - 1, targetPage));

      pagerTranslateX.value = withSpring(-targetPage * SCREEN_W, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
      runOnJS(setTabWithHaptic)(TAB_KEYS[targetPage]);
    });

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        stickyHeaderIndices={[1]}
      >
        {/* ── Child [0]: Header block ── */}
        <View>
          {/* Photo Gallery */}
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
                  e.nativeEvent.contentOffset.x / STATIC_WIDTH,
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
                  {profile.firstName}, {profile.age}
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

            {/* Top-right buttons */}
            <View style={s.topRightButtons}>
              <Pressable
                onPress={() => setShowSearch(true)}
                style={s.settingsBtn}
                hitSlop={8}
              >
                <Search size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => setShowNotifications(true)}
                style={s.settingsBtn}
                hitSlop={8}
              >
                <Bell size={20} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => setShowSettings(true)}
                style={s.settingsBtn}
                hitSlop={8}
              >
                <Settings size={20} color="#FFFFFF" />
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

          {/* Bio + Edit Profile */}
          <Animated.View entering={FadeInUp.duration(400).delay(0)}>
            <View style={s.bioSection}>
              <Text style={s.bioText}>{profile.bio}</Text>
              <Pressable
                onPress={() => setShowEditProfile(true)}
                style={({ pressed }) => [
                  s.editButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={s.editButtonText}>Edit Profile</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View entering={FadeInUp.duration(400).delay(80)}>
            <View style={s.statsRow}>
              <Pressable
                onPress={() => setShowConnections(true)}
                style={s.statBox}
              >
                <Heart size={18} color={COLORS.danger} />
                <Text style={s.statNumber}>{profile.stats.matches}</Text>
                <Text style={s.statLabel}>Connections</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowGroups(true)}
                style={s.statBox}
              >
                <Users size={18} color={COLORS.secondary} />
                <Text style={s.statNumber}>{profile.stats.groups}</Text>
                <Text style={s.statLabel}>Groups</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowEvents(true)}
                style={s.statBox}
              >
                <Calendar size={18} color={COLORS.success} />
                <Text style={s.statNumber}>{profile.stats.events}</Text>
                <Text style={s.statLabel}>Events</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        {/* ── Child [1]: Sticky Tab Bar ── */}
        <View style={s.stickyTabWrapper}>
          <ProfileTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            pagerTranslateX={pagerTranslateX}
            screenWidth={SCREEN_W}
          />
        </View>

        {/* ── Child [2]: Swipeable Tab Content ── */}
        <GestureDetector gesture={tabSwipeGesture}>
          <Animated.View style={s.pagerContainer}>
            <Animated.View
              style={[
                s.pagerContent,
                { width: SCREEN_W * TAB_COUNT },
                pagerContentStyle,
              ]}
            >
              {/* Posts */}
              <View style={[s.tabPage, { width: SCREEN_W }]}>
                {CURRENT_USER_PROFILE_POSTS.length > 0 ? (
                  CURRENT_USER_PROFILE_POSTS.map((post, i) => (
                    <ProfilePostCard key={post.id} post={post} index={i} onPress={() => setSelectedPost(post)} />
                  ))
                ) : (
                  <View style={s.emptyContainer}>
                    <View style={s.emptyIconCircle}>
                      <FileText size={32} color={COLORS.secondary} />
                    </View>
                    <Text style={s.emptyTitle}>No posts yet</Text>
                    <Text style={s.emptyDesc}>
                      Share moments, check in at events, and highlight great group
                      content to build your activity feed.
                    </Text>
                  </View>
                )}
              </View>

              {/* Check-ins */}
              <View style={[s.tabPage, { width: SCREEN_W }]}>
                {CURRENT_USER_CHECKINS.length > 0 ? (
                  <View style={s.checkinGrid}>
                    {CURRENT_USER_CHECKINS.map((post, i) => (
                      <CheckInCard key={post.id} post={post} index={i} />
                    ))}
                  </View>
                ) : (
                  <View style={s.emptyContainer}>
                    <View style={s.emptyIconCircle}>
                      <MapPin size={32} color={COLORS.secondary} />
                    </View>
                    <Text style={s.emptyTitle}>No check-ins yet</Text>
                    <Text style={s.emptyDesc}>
                      Attend events and check in to build your activity timeline.
                    </Text>
                  </View>
                )}
              </View>

              {/* About */}
              <View style={[s.tabPage, { width: SCREEN_W }]}>
                {/* My Interests */}
                <View style={s.section}>
                  <Text style={s.sectionHeading}>My Interests</Text>
                  <View style={s.chipsRow}>
                    {profile.interests.map((interest, i) => {
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

                {/* My Groups */}
                <View style={s.section}>
                  <View style={s.sectionHeaderRow}>
                    <Text style={s.sectionHeading}>My Groups</Text>
                    <View style={s.sectionHeaderActions}>
                      <Pressable
                        hitSlop={8}
                        style={s.seeAllBtn}
                        onPress={() => setShowHealthRing(true)}
                      >
                        <Text style={s.healthRingLink}>Health</Text>
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        style={s.seeAllBtn}
                        onPress={() => setShowGroups(true)}
                      >
                        <Text style={s.seeAllText}>See all</Text>
                      </Pressable>
                    </View>
                  </View>
                  <FlatList<MiniGroupItem>
                    horizontal
                    data={profile.groups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <MiniGroupCard item={item} />}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.groupsList}
                  />
                </View>

                {/* Verification */}
                <View style={s.section}>
                  <VerificationCard
                    currentTier={profile.verificationLevel}
                    onUpgrade={handleVerificationUpgrade}
                  />
                </View>

                {/* Vita Gold Upsell */}
                <View style={s.section}>
                  <GoldUpsell onStartTrial={handleGoldTrial} />
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Overlays ── */}
      <EditProfileSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />
      {showSettings && (
        <SettingsPage
          onClose={() => setShowSettings(false)}
        />
      )}
      {showConnections && (
        <MyConnectionsPage
          onClose={() => setShowConnections(false)}
        />
      )}
      {showGroups && (
        <MyGroupsPage
          onClose={() => setShowGroups(false)}
        />
      )}
      {showEvents && (
        <MyEventsPage
          onClose={() => setShowEvents(false)}
        />
      )}
      {showNotifications && (
        <NotificationsPage
          onClose={() => setShowNotifications(false)}
        />
      )}
      {showHealthRing && (
        <HealthRingDetailPage
          onClose={() => setShowHealthRing(false)}
        />
      )}
      {showGoldSubscription && (
        <GoldSubscriptionPage
          onClose={() => setShowGoldSubscription(false)}
        />
      )}
      {showSearch && (
        <GlobalSearchPage
          onClose={() => setShowSearch(false)}
        />
      )}
      {showVerification && (
        <VerificationFlowPage
          tier={verificationTier}
          onClose={() => setShowVerification(false)}
        />
      )}
      {selectedPost && (
        <FeedPostDetailPage
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
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
    width: STATIC_WIDTH,
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

  // Bio + Edit
  bioSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
    fontFamily: "Inter_400Regular",
  },

  // Sticky tab bar
  stickyTabWrapper: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },

  // Horizontal pager
  pagerContainer: {
    overflow: "hidden",
    minHeight: MIN_TAB_CONTENT_HEIGHT,
  },
  pagerContent: {
    flexDirection: "row",
  },
  tabPage: {
    minHeight: MIN_TAB_CONTENT_HEIGHT,
  },

  // Sections (About tab)
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seeAllBtn: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A7487",
    fontFamily: "Inter_600SemiBold",
  },
  healthRingLink: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
    fontFamily: "Inter_600SemiBold",
  },

  // Chips
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

  // Groups horizontal list
  groupsList: {
    paddingRight: 20,
  },
  miniGroupCard: {
    width: 130,
    alignItems: "center",
    paddingVertical: 14,
  },
  miniGroupRing: {
    marginBottom: 8,
  },
  miniGroupName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 2,
  },
  miniGroupMembers: {
    fontSize: 11,
    color: "#718096",
    fontFamily: "Inter_400Regular",
  },

  // Top-right buttons on photo
  topRightButtons: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 5,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Check-in grid
  checkinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },

  // Empty state
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
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
