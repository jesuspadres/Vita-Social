import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Settings,
  Globe,
  Lock,
  EyeOff,
  Users,
  Calendar,
  MapPin,
  Clock,
  MessageCircle,
  Plus,
} from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
  FadeIn,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthRing } from "@/components/ui/health-ring";
import { GroupFeedPost } from "@/components/groups/GroupFeedPost";
import { HealthWarningBanner } from "@/components/groups/HealthWarningBanner";
import { GroupSettingsPage } from "@/components/groups/GroupSettingsPage";
import { GroupPostDetail } from "@/components/groups/GroupPostDetail";
import { GroupChatPage } from "@/components/groups/GroupChatPage";
import { CreateGroupPostSheet } from "@/components/groups/CreateGroupPostSheet";
import { UserProfilePage, type UserProfileUser } from "@/components/profile/UserProfilePage";
import { EventDetailSheet } from "@/components/map/EventDetailSheet";
import { COLORS, HEALTH_PERIOD_DAYS } from "@/lib/constants";
import {
  mockGroupPosts,
  mockGroupEvents,
  mockGroupMembers,
  type MockGroup,
  type MockGroupPost,
  type MockGroupEvent,
  type MockGroupMember,
  type MockEvent,
} from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const TABS: DetailTab[] = ["feed", "events", "members"];
const TAB_COUNT = TABS.length;
const TAB_LABELS = ["Feed", "Events", "Members"];

export interface GroupDetailProps {
  group: MockGroup;
  onBack: () => void;
}

type DetailTab = "feed" | "events" | "members";

// ---------------------------------------------------------------------------
// Privacy Icon Map
// ---------------------------------------------------------------------------

const privacyIcons = {
  public: Globe,
  private: Lock,
  secret: EyeOff,
} as const;

// ---------------------------------------------------------------------------
// Role Badge Variants
// ---------------------------------------------------------------------------

const roleBadgeVariant = {
  Admin: "danger" as const,
  Moderator: "info" as const,
  Member: "default" as const,
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function EventCard({ event, onPress }: { event: MockGroupEvent; onPress?: () => void }) {
  const [rsvpd, setRsvpd] = useState(false);

  return (
    <Pressable onPress={onPress}>
    <Animated.View entering={FadeIn.duration(300)} style={styles.eventCard}>
      <Image
        source={{ uri: event.cover_image }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={styles.eventMetaRow}>
          <Calendar size={13} color="#6B7280" />
          <Text style={styles.eventMeta}>{event.date}</Text>
          <Clock size={13} color="#6B7280" />
          <Text style={styles.eventMeta}>{event.time}</Text>
        </View>
        <View style={styles.eventMetaRow}>
          <MapPin size={13} color="#6B7280" />
          <Text style={styles.eventMeta} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        <View style={styles.eventBottom}>
          <View style={styles.eventMetaRow}>
            <Users size={13} color="#6B7280" />
            <Text style={styles.eventMeta}>{event.attendees} attending</Text>
          </View>
          <Button
            size="sm"
            variant={rsvpd ? "ghost" : "secondary"}
            onPress={() => setRsvpd((p) => !p)}
          >
            {rsvpd ? "Going" : "RSVP"}
          </Button>
        </View>
      </View>
    </Animated.View>
    </Pressable>
  );
}

function MemberRow({ member, onPress }: { member: MockGroupMember; onPress?: () => void }) {
  const daysElapsed = HEALTH_PERIOD_DAYS - member.health_days_remaining;

  return (
    <Pressable onPress={onPress} style={styles.memberRow}>
      <Avatar
        size="md"
        src={member.user.avatar}
        name={member.user.name}
        online={member.user.online}
        badge={member.user.badge}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.user.name}</Text>
        <Badge variant={roleBadgeVariant[member.role]}>{member.role}</Badge>
      </View>
      <HealthRing daysElapsed={Math.max(0, daysElapsed)} size={40} strokeWidth={3} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Animated Tab Label — text color follows swipe in real-time
// ---------------------------------------------------------------------------

function AnimatedTabLabel({
  label,
  index,
  tabTranslateX,
  screenWidth,
  onPress,
}: {
  label: string;
  index: number;
  tabTranslateX: SharedValue<number>;
  screenWidth: number;
  onPress: () => void;
}) {
  const textStyle = useAnimatedStyle(() => {
    const progress = screenWidth > 0 ? -tabTranslateX.value / screenWidth : 0;
    const color = interpolateColor(
      progress,
      [index - 1, index, index + 1],
      ["#A0AEC0", "#1A365D", "#A0AEC0"],
    );
    return { color };
  });

  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <Animated.Text style={[styles.tabText, textStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function memberToProfileUser(member: MockGroupMember): UserProfileUser {
  return {
    id: member.user.id,
    first_name: member.user.name,
    avatar_url: member.user.avatar ?? "",
    verification_level:
      member.user.badge === "blue"
        ? "photo"
        : member.user.badge === "green"
          ? "id"
          : member.user.badge === "gold"
            ? "gold"
            : undefined,
    online: member.user.online,
  };
}

function groupEventToMockEvent(event: MockGroupEvent): MockEvent {
  // Parse the date/time strings into rough ISO dates
  const now = new Date();
  return {
    id: event.id,
    title: event.title,
    location_name: event.location,
    description: event.description,
    starts_at: now.toISOString(),
    ends_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    host: { id: "group-host", name: "Group", avatar_url: null, verified: false },
    attendee_count: event.attendees,
    max_capacity: null,
    visibility: "group",
    distance: 0,
    pin_x: 50,
    pin_y: 50,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupDetail({ group, onBack }: GroupDetailProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<DetailTab>("feed");
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MockGroupPost | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);

  // Slide-in animation
  const slideX = useSharedValue(400);

  useEffect(() => {
    slideX.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezierFn(0.22, 1, 0.36, 1),
    });
  }, [slideX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // Swipe-right-to-go-back gesture (applied to header area)
  const backGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        slideX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (
        event.translationX > screenWidth * 0.3 ||
        event.velocityX > 500
      ) {
        slideX.value = withTiming(screenWidth, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onBack)();
        });
      } else {
        slideX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const handleBack = useCallback(() => {
    slideX.value = withTiming(400, { duration: 250 });
    setTimeout(onBack, 260);
  }, [slideX, onBack]);

  const PrivacyIcon = privacyIcons[group.privacy_tier];

  // ── Tab pager animation ──

  const tabTranslateX = useSharedValue(0);
  const tabContextX = useSharedValue(0);

  const setTabWithHaptic = useCallback((tab: DetailTab) => {
    setActiveTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const handleTabPress = useCallback(
    (tab: DetailTab) => {
      const index = TABS.indexOf(tab);
      tabTranslateX.value = withTiming(-index * screenWidth, { duration: 300 });
      setTabWithHaptic(tab);
    },
    [screenWidth, tabTranslateX, setTabWithHaptic],
  );

  // Animated underline follows swipe in real-time
  const underlineStyle = useAnimatedStyle(() => {
    if (tabRowWidth === 0 || screenWidth === 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const tw = tabRowWidth / TAB_COUNT;
    const progress = -tabTranslateX.value / screenWidth;
    const underlineWidth = tw * 0.6;
    const offset = tw * 0.2; // center the 60% underline
    return {
      width: underlineWidth,
      transform: [{ translateX: offset + progress * tw }],
    };
  });

  // Content pager style
  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabTranslateX.value }],
  }));

  // Tab swipe gesture
  const tabSwipeGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-10, 10])
    .onStart(() => {
      tabContextX.value = tabTranslateX.value;
    })
    .onUpdate((e) => {
      const newX = tabContextX.value + e.translationX;
      const maxX = 0;
      const minX = -(TAB_COUNT - 1) * screenWidth;
      if (newX > maxX) {
        tabTranslateX.value = maxX + (newX - maxX) * 0.3;
      } else if (newX < minX) {
        tabTranslateX.value = minX + (newX - minX) * 0.3;
      } else {
        tabTranslateX.value = newX;
      }
    })
    .onEnd((e) => {
      const currentPage = -tabTranslateX.value / screenWidth;
      let targetPage: number;
      if (Math.abs(e.velocityX) > 500) {
        targetPage =
          e.velocityX > 0 ? Math.floor(currentPage) : Math.ceil(currentPage);
      } else {
        targetPage = Math.round(currentPage);
      }
      targetPage = Math.max(0, Math.min(TAB_COUNT - 1, targetPage));
      tabTranslateX.value = withSpring(-targetPage * screenWidth, {
        damping: 20,
        stiffness: 200,
        overshootClamping: true,
      });
      runOnJS(setTabWithHaptic)(TABS[targetPage]);
    });

  return (
    <Animated.View
      style={[
        styles.overlay,
        slideStyle,
        { paddingTop: 0 },
      ]}
    >
      {/* Cover Image + Header Buttons (swipe-right-to-go-back here) */}
      <GestureDetector gesture={backGesture}>
        <Animated.View>
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: group.cover_image }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.6)"]}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Top buttons */}
            <View style={[styles.coverTopRow, { top: insets.top + 8 }]}>
              <Pressable
                onPress={handleBack}
                style={styles.coverButton}
                hitSlop={8}
              >
                <ArrowLeft size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.coverButtonGroup}>
                <Pressable
                  style={styles.coverButton}
                  hitSlop={8}
                  onPress={() => setShowGroupChat(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Group chat"
                >
                  <MessageCircle size={20} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  style={styles.coverButton}
                  hitSlop={8}
                  onPress={() => setShowGroupSettings(true)}
                >
                  <Settings size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Group name overlay */}
            <View style={styles.coverNameContainer}>
              <Text style={styles.coverName}>{group.name}</Text>
            </View>
          </View>

          {/* Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <PrivacyIcon size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {group.privacy_tier.charAt(0).toUpperCase() +
                  group.privacy_tier.slice(1)}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.metaText}>{group.member_count} members</Text>
            </View>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>Created {group.created_at}</Text>
          </View>

          {/* Health Warning Banner (for members) */}
          {group.is_member && group.health_days_remaining <= 30 && (
            <HealthWarningBanner daysRemaining={group.health_days_remaining} />
          )}
        </Animated.View>
      </GestureDetector>

      {/* Tab Switcher — underline tracks swipe in real-time */}
      <View
        style={styles.tabRow}
        onLayout={(e) => setTabRowWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.animatedUnderline, underlineStyle]} />
        {TABS.map((tab, idx) => (
          <AnimatedTabLabel
            key={tab}
            label={TAB_LABELS[idx]}
            index={idx}
            tabTranslateX={tabTranslateX}
            screenWidth={screenWidth}
            onPress={() => handleTabPress(tab)}
          />
        ))}
      </View>

      {/* Swipeable Tab Content Pager */}
      <GestureDetector gesture={tabSwipeGesture}>
        <Animated.View style={styles.tabContent}>
          <Animated.View
            style={[
              styles.pagerContent,
              { width: screenWidth * TAB_COUNT },
              pagerStyle,
            ]}
          >
            {/* Feed */}
            <View style={{ width: screenWidth }}>
              <FlatList
                data={mockGroupPosts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => setSelectedPost(item)}>
                    <GroupFeedPost post={item} />
                  </Pressable>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
              />
            </View>

            {/* Events */}
            <View style={{ width: screenWidth }}>
              <FlatList
                data={mockGroupEvents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <EventCard
                    event={item}
                    onPress={() => setSelectedEvent(groupEventToMockEvent(item))}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
              />
            </View>

            {/* Members */}
            <View style={{ width: screenWidth }}>
              <FlatList
                data={mockGroupMembers}
                keyExtractor={(item) => item.user.id}
                renderItem={({ item }) => (
                  <MemberRow
                    member={item}
                    onPress={() => setSelectedMemberId(item.user.id)}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* FAB for creating post */}
      <Pressable
        onPress={() => setShowCreatePost(true)}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel="Create new post"
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>

      {/* Group Settings Overlay */}
      {showGroupSettings && (
        <GroupSettingsPage
          group={group}
          onClose={() => setShowGroupSettings(false)}
        />
      )}

      {/* Group Chat Overlay */}
      {showGroupChat && (
        <GroupChatPage
          group={{
            id: group.id,
            name: group.name,
            avatar_url: group.cover_image,
            member_count: group.member_count,
          }}
          onClose={() => setShowGroupChat(false)}
        />
      )}

      {/* Post Detail Overlay */}
      {selectedPost && (
        <GroupPostDetail
          post={{
            id: selectedPost.id,
            author: {
              name: selectedPost.user.name,
              avatar_url: selectedPost.user.avatar ?? "",
            },
            body: selectedPost.content,
            image_url: selectedPost.image,
            likes: selectedPost.likes,
            comments: selectedPost.comments,
            created_at: selectedPost.timestamp,
          }}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Create Post Sheet */}
      <CreateGroupPostSheet
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        groupName={group.name}
      />

      {/* Event Detail Sheet */}
      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCheckIn={() => setSelectedEvent(null)}
      />

      {/* Member Profile Overlay */}
      {selectedMemberId != null && (() => {
        const member = mockGroupMembers.find((m) => m.user.id === selectedMemberId);
        if (!member) return null;
        return (
          <UserProfilePage
            user={memberToProfileUser(member)}
            onClose={() => setSelectedMemberId(null)}
          />
        );
      })()}
    </Animated.View>
  );
}

GroupDetail.displayName = "GroupDetail";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 50,
  },

  // Cover
  coverContainer: {
    height: 200,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverTopRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverButtonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  coverNameContainer: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 16,
  },
  coverName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },

  // Metadata
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
    position: "relative",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  animatedUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#1A365D",
  },

  // Tab content pager
  tabContent: {
    flex: 1,
    overflow: "hidden",
  },
  pagerContent: {
    flexDirection: "row",
    flex: 1,
  },

  // Event Card
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  eventImage: {
    width: "100%",
    height: 140,
  },
  eventInfo: {
    padding: 12,
    gap: 6,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  eventMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  eventBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },

  // Member Row
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A365D",
    fontFamily: "Inter_600SemiBold",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 40,
  },
});
