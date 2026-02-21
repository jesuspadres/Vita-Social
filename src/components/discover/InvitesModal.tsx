import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  ArrowLeft,
  Heart,
  X,
  Users,
  Sparkles,
  Crown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  mockGroupInvites,
  mockWarmInvites,
  mockColdInvites,
  getAge,
  type MockGroupInvite,
  type MockPersonalInvite,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;
const PADDING_H = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;
const TAB_COUNT = 2;
const TAB_KEYS = ["groups", "people"] as const;

// For the prototype, treat current user as free tier to demonstrate the paywall
const IS_PREMIUM_USER = false;

type InviteTab = (typeof TAB_KEYS)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface InvitesModalProps {
  visible: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// InvitesModal Component
// ---------------------------------------------------------------------------

export function InvitesModal({ visible, onClose }: InvitesModalProps) {
  const { width: SCREEN_W } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<InviteTab>("groups");
  const [groupInvites, setGroupInvites] = useState([...mockGroupInvites]);
  const [warmInvites, setWarmInvites] = useState([...mockWarmInvites]);
  const [coldInvites, setColdInvites] = useState([...mockColdInvites]);

  // Tab pill layout
  const [pillContainerWidth, setPillContainerWidth] = useState(0);

  // Shared values
  const dismissX = useSharedValue(0); // swipe-to-dismiss
  const tabPagerX = useSharedValue(0); // horizontal tab pager
  const tabContextX = useSharedValue(0);

  // Pill follows swipe in real-time
  const pillStyle = useAnimatedStyle(() => {
    if (pillContainerWidth === 0 || SCREEN_W === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const tw = pillContainerWidth / TAB_COUNT;
    const progress = -tabPagerX.value / SCREEN_W;
    return {
      transform: [{ translateX: progress * tw }],
      width: tw,
    };
  });

  // Tab content slides with finger
  const tabContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPagerX.value }],
  }));

  // Dismiss slide
  const dismissStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dismissX.value }],
  }));

  // Animated tab text colors
  const groupsTextStyle = useAnimatedStyle(() => {
    const progress = SCREEN_W > 0 ? -tabPagerX.value / SCREEN_W : 0;
    const color = interpolateColor(
      progress,
      [-1, 0, 1],
      ["#A0AEC0", "#FFFFFF", "#A0AEC0"],
    );
    return { color };
  });

  const peopleTextStyle = useAnimatedStyle(() => {
    const progress = SCREEN_W > 0 ? -tabPagerX.value / SCREEN_W : 0;
    const color = interpolateColor(
      progress,
      [0, 1, 2],
      ["#A0AEC0", "#FFFFFF", "#A0AEC0"],
    );
    return { color };
  });

  const setTabWithHaptic = useCallback((key: InviteTab) => {
    setActiveTab(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleTabPress = useCallback(
    (tab: InviteTab) => {
      const index = TAB_KEYS.indexOf(tab);
      tabPagerX.value = withTiming(-index * SCREEN_W, { duration: 300 });
      setTabWithHaptic(tab);
    },
    [SCREEN_W, tabPagerX, setTabWithHaptic],
  );

  // ── Group invite actions ──

  const handleAcceptGroup = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGroupInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleDeclineGroup = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGroupInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Personal invite actions ──

  const handleAcceptWarm = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWarmInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleDeclineWarm = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWarmInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleAcceptCold = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setColdInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleDeclineCold = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColdInvites((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // ── Renderers ──

  const renderGroupInvite = useCallback(
    ({ item }: { item: MockGroupInvite }) => (
      <View style={styles.groupInviteCard}>
        <Image
          source={{ uri: item.group.cover_image }}
          style={styles.groupInviteImage}
          resizeMode="cover"
        />
        <View style={styles.groupInviteInfo}>
          <Text style={styles.groupInviteName} numberOfLines={1}>
            {item.group.name}
          </Text>
          <View style={styles.groupInviteMeta}>
            <Users size={12} color="#718096" />
            <Text style={styles.groupInviteMetaText}>
              {item.group.member_count} members
            </Text>
          </View>
          <Text style={styles.groupInviteBy} numberOfLines={1}>
            Invited by {item.invited_by.name}
          </Text>
          {item.message && (
            <Text style={styles.groupInviteMessage} numberOfLines={2}>
              &quot;{item.message}&quot;
            </Text>
          )}
          <View style={styles.groupInviteActions}>
            <Pressable
              style={styles.declineBtn}
              onPress={() => handleDeclineGroup(item.id)}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
            <Pressable
              style={styles.acceptBtn}
              onPress={() => handleAcceptGroup(item.id)}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    [handleAcceptGroup, handleDeclineGroup],
  );

  const getSourceLabel = (invite: MockPersonalInvite): string => {
    if (!invite.source) return "";
    switch (invite.source.type) {
      case "group":
        return `via ${invite.source.groupName}`;
      case "event":
        return `Attended ${invite.source.eventName}`;
      case "mutual_friends":
        return `${invite.source.count} mutual friends`;
    }
  };

  const renderWarmInvite = useCallback(
    ({ item }: { item: MockPersonalInvite }) => (
      <View style={styles.warmInviteCard}>
        <Image
          source={{ uri: item.user.avatar_url ?? undefined }}
          style={styles.warmInviteAvatar}
          resizeMode="cover"
        />
        <View style={styles.warmInviteInfo}>
          <Text style={styles.warmInviteName}>
            {item.user.first_name}, {getAge(item.user.birthdate)}
          </Text>
          <View style={styles.warmInviteSourceRow}>
            <Sparkles size={12} color="#4A90A4" />
            <Text style={styles.warmInviteSourceText}>
              {getSourceLabel(item)}
            </Text>
          </View>
        </View>
        <View style={styles.warmInviteActions}>
          <Pressable
            style={styles.miniDeclineBtn}
            onPress={() => handleDeclineWarm(item.id)}
          >
            <X size={16} color="#A0AEC0" />
          </Pressable>
          <Pressable
            style={styles.miniAcceptBtn}
            onPress={() => handleAcceptWarm(item.id)}
          >
            <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    ),
    [handleAcceptWarm, handleDeclineWarm],
  );

  // ── Cold invites grid ──

  const renderColdInviteCard = useCallback(
    ({ item }: { item: MockPersonalInvite }) => {
      if (!IS_PREMIUM_USER) {
        // Blurred card for free users
        return (
          <View style={styles.coldCard}>
            <Image
              source={{ uri: item.user.avatar_url ?? undefined }}
              style={styles.coldCardImage}
              blurRadius={20}
              resizeMode="cover"
            />
            <View style={styles.coldBlurOverlay}>
              <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          </View>
        );
      }

      // Revealed card for premium users
      return (
        <View style={styles.coldCard}>
          <Image
            source={{ uri: item.user.avatar_url ?? undefined }}
            style={styles.coldCardImage}
            resizeMode="cover"
          />
          <View style={styles.coldRevealedInfo}>
            <View style={styles.coldRevealedGradient}>
              <Text style={styles.coldRevealedName}>
                {item.user.first_name}, {getAge(item.user.birthdate)}
              </Text>
            </View>
            <View style={styles.coldCardActions}>
              <Pressable
                style={styles.coldPassBtn}
                onPress={() => handleDeclineCold(item.id)}
              >
                <X size={18} color="#A0AEC0" />
              </Pressable>
              <Pressable
                style={styles.coldLikeBtn}
                onPress={() => handleAcceptCold(item.id)}
              >
                <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [handleAcceptCold, handleDeclineCold],
  );

  // ── Combined gesture: tab switching + dismiss ──

  const combinedGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      tabContextX.value = tabPagerX.value;
    })
    .onUpdate((e) => {
      const rawNewX = tabContextX.value + e.translationX;
      const maxX = 0;
      const minX = -(TAB_COUNT - 1) * SCREEN_W;

      if (rawNewX > maxX) {
        // Past first tab → dismiss mode
        tabPagerX.value = maxX;
        dismissX.value = rawNewX - maxX;
      } else if (rawNewX < minX) {
        // Past last tab → rubber band
        tabPagerX.value = minX + (rawNewX - minX) * 0.3;
        dismissX.value = 0;
      } else {
        // Normal tab switching
        tabPagerX.value = rawNewX;
        dismissX.value = 0;
      }
    })
    .onEnd((e) => {
      if (dismissX.value > 0) {
        // Was in dismiss mode
        if (
          dismissX.value > SWIPE_THRESHOLD ||
          e.velocityX > VELOCITY_THRESHOLD
        ) {
          dismissX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
            runOnJS(onClose)();
            dismissX.value = 0;
          });
        } else {
          dismissX.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      } else {
        // Tab snap
        const currentPage = -tabPagerX.value / SCREEN_W;
        let targetPage: number;
        if (Math.abs(e.velocityX) > 500) {
          targetPage =
            e.velocityX > 0
              ? Math.floor(currentPage)
              : Math.ceil(currentPage);
        } else {
          targetPage = Math.round(currentPage);
        }
        targetPage = Math.max(0, Math.min(TAB_COUNT - 1, targetPage));

        tabPagerX.value = withSpring(-targetPage * SCREEN_W, {
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        });
        runOnJS(setTabWithHaptic)(TAB_KEYS[targetPage]);
      }
    });

  // ── Main render ──

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[styles.container, dismissStyle]}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <ArrowLeft size={22} color="#1A365D" />
          </Pressable>
          <Text style={styles.headerTitle}>Invites</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Switcher — pill tracks finger */}
        <View style={styles.tabRow}>
          <View
            style={styles.tabContainer}
            onLayout={(e) => setPillContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View style={[styles.pill, pillStyle]} />

            <Pressable
              style={styles.tabButton}
              onPress={() => handleTabPress("groups")}
            >
              <Animated.Text style={[styles.tabText, groupsTextStyle]}>
                Groups
              </Animated.Text>
              {groupInvites.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{groupInvites.length}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={styles.tabButton}
              onPress={() => handleTabPress("people")}
            >
              <Animated.Text style={[styles.tabText, peopleTextStyle]}>
                People
              </Animated.Text>
              {(warmInvites.length + coldInvites.length) > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {warmInvites.length + coldInvites.length}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Swipeable Tab Content */}
        <View style={styles.pagerContainer}>
          <Animated.View
            style={[
              styles.pagerContent,
              { width: SCREEN_W * TAB_COUNT },
              tabContentStyle,
            ]}
          >
            {/* ─── Page 0: Group Invites ─── */}
            <View style={{ width: SCREEN_W, flex: 1 }}>
              {groupInvites.length > 0 ? (
                <FlatList
                  data={groupInvites}
                  keyExtractor={(item) => item.id}
                  renderItem={renderGroupInvite}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={32} color="#4A90A4" />
                  </View>
                  <Text style={styles.emptyTitle}>No group invites</Text>
                  <Text style={styles.emptyDesc}>
                    When someone invites you to a group, it will appear here.
                  </Text>
                </View>
              )}
            </View>

            {/* ─── Page 1: People Invites ─── */}
            <View style={{ width: SCREEN_W, flex: 1 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {/* Warm Invites Section */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Warm Invites</Text>
                    {warmInvites.length > 0 && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {warmInvites.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    People connected to your world
                  </Text>
                </View>

                {warmInvites.length > 0 ? (
                  warmInvites.map((invite) => (
                    <View key={invite.id}>
                      {renderWarmInvite({ item: invite })}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>
                      No warm invites right now
                    </Text>
                  </View>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Cold Invites Section */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Cold Invites</Text>
                    {coldInvites.length > 0 && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {coldInvites.length}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sectionSubtitle}>
                    People who liked your profile
                  </Text>
                </View>

                {/* Gold upsell banner for free users */}
                {!IS_PREMIUM_USER && coldInvites.length > 0 && (
                  <Pressable style={styles.upsellBanner}>
                    <View style={styles.upsellIconRow}>
                      <Crown size={18} color="#D4AF37" />
                      <Text style={styles.upsellTitle}>Upgrade to Vita Gold</Text>
                    </View>
                    <Text style={styles.upsellDesc}>
                      See who liked you and connect instantly
                    </Text>
                  </Pressable>
                )}

                {/* Cold invites grid */}
                {coldInvites.length > 0 ? (
                  <View style={styles.coldGrid}>
                    {coldInvites.map((invite, index) => (
                      <View
                        key={invite.id}
                        style={[
                          styles.coldGridItem,
                          index % 2 === 0 ? { marginRight: COLUMN_GAP / 2 } : { marginLeft: COLUMN_GAP / 2 },
                        ]}
                      >
                        {renderColdInviteCard({ item: invite })}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>
                      No cold invites right now
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
      </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  headerSpacer: {
    width: 40,
  },

  // Tab Switcher
  tabRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F7FAFC",
    borderRadius: 999,
    padding: 4,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: "#1A365D",
    borderRadius: 999,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    zIndex: 1,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },

  // Horizontal pager
  pagerContainer: {
    flex: 1,
    overflow: "hidden",
  },
  pagerContent: {
    flexDirection: "row",
    flex: 1,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Group Invite Card
  groupInviteCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  groupInviteImage: {
    width: 100,
    height: "100%",
    minHeight: 120,
  },
  groupInviteInfo: {
    flex: 1,
    padding: 12,
  },
  groupInviteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  groupInviteMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  groupInviteMetaText: {
    fontSize: 12,
    color: "#718096",
    fontFamily: "Inter_400Regular",
  },
  groupInviteBy: {
    fontSize: 13,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  groupInviteMessage: {
    fontSize: 12,
    color: "#718096",
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginBottom: 8,
  },
  groupInviteActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  declineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0AEC0",
    fontFamily: "Inter_600SemiBold",
  },
  acceptBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1A365D",
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },

  // Sections
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  sectionBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Warm Invite Card
  warmInviteCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  warmInviteAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E2E8F0",
  },
  warmInviteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  warmInviteName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },
  warmInviteSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  warmInviteSourceText: {
    fontSize: 13,
    color: "#3A7487",
    fontFamily: "Inter_500Medium",
  },
  warmInviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  miniDeclineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  miniAcceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#38A169",
    alignItems: "center",
    justifyContent: "center",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 20,
  },

  // Gold upsell banner
  upsellBanner: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  upsellIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  upsellTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    fontFamily: "Inter_700Bold",
  },
  upsellDesc: {
    fontSize: 13,
    color: "#A16207",
    fontFamily: "Inter_400Regular",
  },

  // Cold invites grid
  coldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 24,
  },
  coldGridItem: {
    width: CARD_WIDTH,
    marginBottom: COLUMN_GAP,
  },
  coldCard: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  coldCardImage: {
    width: "100%",
    height: "100%",
  },
  coldBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  coldRevealedInfo: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  coldRevealedGradient: {
    paddingHorizontal: 12,
    paddingBottom: 48,
    paddingTop: 40,
  },
  coldRevealedName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  coldCardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  coldPassBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  coldLikeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#38A169",
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1A365D",
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
  emptySection: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptySectionText: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
});

InvitesModal.displayName = "InvitesModal";
