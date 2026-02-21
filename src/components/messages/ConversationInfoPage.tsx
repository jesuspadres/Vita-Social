import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
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
  MessageSquare,
  Phone,
  Video,
  Image as ImageIcon,
  Link2,
  Users,
  Bell,
  Volume2,
  Ban,
  AlertTriangle,
  UserX,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Avatar } from "@/components/ui/avatar";
import { ReportSheet } from "@/components/moderation/ReportSheet";
import { BlockConfirmSheet } from "@/components/moderation/BlockConfirmSheet";
import { UnmatchConfirmSheet } from "@/components/moderation/UnmatchConfirmSheet";
import { COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { SharedMediaGalleryPage } from "@/components/messages/SharedMediaGalleryPage";
import { CustomSoundPickerSheet } from "@/components/messages/CustomSoundPickerSheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface ConversationInfoPageProps {
  user: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    verification_level?: string;
    online?: boolean;
    interests?: string[];
  };
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Verification badge mapping
// ---------------------------------------------------------------------------

const VERIFICATION_BADGE_MAP: Record<string, "none" | "green" | "blue" | "gold"> = {
  none: "none",
  photo: "blue",
  id: "green",
  green: "green",
  blue: "blue",
  gold: "gold",
};

function getVerificationBadge(level?: string): "none" | "green" | "blue" | "gold" {
  if (!level) return "none";
  return VERIFICATION_BADGE_MAP[level] ?? "none";
}

function getVerificationLabel(level?: string): string | null {
  if (!level || level === "none") return null;
  if (level === "photo") return "Photo Verified";
  if (level === "id") return "ID Verified";
  if (level === "gold") return "Gold Member";
  return "Verified";
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

// ---------------------------------------------------------------------------
// Menu Item
// ---------------------------------------------------------------------------

function MenuItem({
  Icon,
  label,
  value,
  onPress,
  danger,
  showChevron = true,
}: {
  Icon?: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={s.menuItem}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {Icon && (
        <Icon
          size={18}
          color={danger ? COLORS.danger : "#718096"}
          strokeWidth={1.75}
        />
      )}
      <View style={s.menuItemTextContainer}>
        <Text
          style={[s.menuItemLabel, danger && { color: COLORS.danger }]}
        >
          {label}
        </Text>
        {value ? <Text style={s.menuItemValue}>{value}</Text> : null}
      </View>
      {showChevron && !danger && (
        <ChevronRight size={16} color="#CBD5E0" />
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Toggle Item
// ---------------------------------------------------------------------------

function ToggleItem({
  Icon,
  label,
  enabled,
  onToggle,
}: {
  Icon?: LucideIcon;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={s.toggleItem}>
      {Icon && <Icon size={18} color="#718096" strokeWidth={1.75} />}
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: "#E2E8F0", true: COLORS.secondary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E2E8F0"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Button
// ---------------------------------------------------------------------------

function QuickActionButton({
  Icon,
  label,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.quickActionBtn,
        pressed && { opacity: 0.7 },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={s.quickActionCircle}>
        <Icon size={22} color="#FFFFFF" strokeWidth={1.75} />
      </View>
      <Text style={s.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ConversationInfoPage({
  user,
  onClose,
}: ConversationInfoPageProps) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showUnmatch, setShowUnmatch] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [sharedMediaTab, setSharedMediaTab] = useState<"photos" | "links">("photos");
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState("Default");

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

  const badge = getVerificationBadge(user.verification_level);
  const verificationLabel = getVerificationLabel(user.verification_level);

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
            <Text style={s.headerTitle}>Info</Text>
            <View style={s.headerSpacer} />
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* User Hero Section */}
            <View style={s.heroSection}>
              <Avatar
                size="xl"
                src={user.avatar_url}
                name={user.first_name}
                online={user.online}
                badge={badge}
              />
              <View style={s.heroNameRow}>
                <Text style={s.heroName}>{user.first_name}</Text>
                {verificationLabel && (
                  <View style={s.verificationBadge}>
                    <Text style={s.verificationBadgeText}>
                      {verificationLabel}
                    </Text>
                  </View>
                )}
              </View>
              {user.online && (
                <View style={s.onlineRow}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineText}>Online</Text>
                </View>
              )}
            </View>

            {/* Quick Action Row */}
            <View style={s.quickActionRow}>
              <QuickActionButton Icon={MessageSquare} label="Message" />
              <QuickActionButton
                Icon={Phone}
                label="Call"
                onPress={() => toast("Voice calls will be available in a future update", "info")}
              />
              <QuickActionButton
                Icon={Video}
                label="Video"
                onPress={() => toast("Video calls will be available in a future update", "info")}
              />
            </View>

            {/* Shared Content Section */}
            <SectionHeader title="SHARED CONTENT" />
            <View style={s.sectionGroup}>
              <MenuItem
                Icon={ImageIcon}
                label="Photos"
                value="4"
                onPress={() => {
                  setSharedMediaTab("photos");
                  setShowSharedMedia(true);
                }}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={Link2}
                label="Links"
                value="2"
                onPress={() => {
                  setSharedMediaTab("links");
                  setShowSharedMedia(true);
                }}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={Users}
                label="Groups"
                value="0"
              />
            </View>

            {/* Conversation Settings Section */}
            <SectionHeader title="CONVERSATION" />
            <View style={s.sectionGroup}>
              <ToggleItem
                Icon={Bell}
                label="Mute Notifications"
                enabled={muteNotifications}
                onToggle={() => setMuteNotifications((p) => !p)}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={Volume2}
                label="Custom Sound"
                value={selectedSound}
                onPress={() => setShowSoundPicker(true)}
              />
            </View>

            {/* Actions Section */}
            <SectionHeader title="ACTIONS" />
            <View style={s.sectionGroup}>
              <MenuItem
                Icon={Ban}
                label={`Block ${user.first_name}`}
                danger
                showChevron={false}
                onPress={() => setShowBlock(true)}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={AlertTriangle}
                label={`Report ${user.first_name}`}
                danger
                showChevron={false}
                onPress={() => setShowReport(true)}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={UserX}
                label="Unmatch"
                danger
                showChevron={false}
                onPress={() => setShowUnmatch(true)}
              />
            </View>
          </ScrollView>
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
          userAvatar={user.avatar_url ?? ""}
          onConfirm={() => { setShowBlock(false); }}
        />
        <UnmatchConfirmSheet
          visible={showUnmatch}
          onClose={() => setShowUnmatch(false)}
          userName={user.first_name}
          userAvatar={user.avatar_url ?? ""}
          onConfirm={() => { setShowUnmatch(false); }}
        />

        {/* Shared Media Gallery */}
        {showSharedMedia && (
          <SharedMediaGalleryPage
            onClose={() => setShowSharedMedia(false)}
            userName={user.first_name}
            initialTab={sharedMediaTab}
          />
        )}

        {/* Custom Sound Picker */}
        <CustomSoundPickerSheet
          visible={showSoundPicker}
          onClose={() => setShowSoundPicker(false)}
          currentSound={selectedSound}
          onSelect={setSelectedSound}
        />
      </Animated.View>
    </GestureDetector>
  );
}

ConversationInfoPage.displayName = "ConversationInfoPage";

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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Hero Section
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  heroName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
  },
  verificationBadge: {
    backgroundColor: "rgba(49, 130, 206, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  verificationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3182CE",
    fontFamily: "Inter_600SemiBold",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#38A169",
  },
  onlineText: {
    fontSize: 13,
    color: "#38A169",
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
  },

  // Quick Action Row
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    paddingVertical: 20,
  },
  quickActionBtn: {
    alignItems: "center",
    gap: 6,
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90A4",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Inter_500Medium",
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A0AEC0",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    paddingLeft: 4,
    fontFamily: "Inter_700Bold",
  },

  // Section group
  sectionGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 30,
  },

  // Menu item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  menuItemValue: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // Toggle item
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 48,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
});
