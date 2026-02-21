import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
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
  Phone,
  Mail,
  Link2,
  Lock,
  ChevronRight,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { COLORS } from "@/lib/constants";
import { ChangePasswordPage } from "@/components/profile/ChangePasswordPage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface AccountSettingsPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Profile Summary Card
// ---------------------------------------------------------------------------

function ProfileSummaryCard() {
  return (
    <View style={s.profileCard}>
      <View style={s.profileAvatarContainer}>
        <Image
          source={{ uri: "https://api.dicebear.com/9.x/avataaars/svg?seed=MayaRichardson" }}
          style={s.profileAvatar}
        />
        <View style={s.profileAvatarRing} />
      </View>
      <Text style={s.profileName}>Maya Richardson</Text>
      <Text style={s.profileEmail}>maya@vitaapp.com</Text>
    </View>
  );
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
  subtitle,
  onPress,
  danger,
  showChevron = true,
}: {
  Icon?: LucideIcon;
  label: string;
  value?: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={s.menuItem}>
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
        {subtitle && (
          <Text style={s.menuItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {value && <Text style={s.menuItemValue}>{value}</Text>}
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
// Main Component
// ---------------------------------------------------------------------------

export function AccountSettingsPage({ onClose }: AccountSettingsPageProps) {
  const insets = useSafeAreaInsets();

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

  // Linked accounts
  const [googleLinked, setGoogleLinked] = useState(true);
  const [appleLinked, setAppleLinked] = useState(false);

  // Sub-pages
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <GestureDetector gesture={panGesture}>
    <Animated.View style={[s.overlay, slideStyle]}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            onPress={handleClose}
            style={s.backBtn}
            hitSlop={8}
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>
          <Text style={s.headerTitle}>Account</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Summary Card ── */}
          <ProfileSummaryCard />

          {/* ── Personal Info ── */}
          <SectionHeader title="PERSONAL INFO" />
          <View style={s.sectionGroup}>
            <MenuItem
              Icon={Phone}
              label="Phone Number"
              value="***-***-4528"
              showChevron={false}
            />
            <View style={s.itemDivider} />
            <MenuItem
              Icon={Mail}
              label="Email"
              value="maya@vitaapp.com"
              showChevron={false}
            />
          </View>

          {/* ── Linked Accounts ── */}
          <SectionHeader title="LINKED ACCOUNTS" />
          <View style={s.sectionGroup}>
            <ToggleItem
              Icon={Link2}
              label="Google"
              enabled={googleLinked}
              onToggle={() => setGoogleLinked((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Link2}
              label="Apple"
              enabled={appleLinked}
              onToggle={() => setAppleLinked((p) => !p)}
            />
          </View>

          {/* ── Security ── */}
          <SectionHeader title="SECURITY" />
          <View style={s.sectionGroup}>
            <MenuItem
              Icon={Lock}
              label="Change Password"
              subtitle="Update your password for security"
              onPress={() => setShowChangePassword(true)}
            />
          </View>

          {/* ── Danger Zone ── */}
          <SectionHeader title="DANGER ZONE" />
          <View style={[s.sectionGroup, s.dangerGroup]}>
            {/* Warning description */}
            <View style={s.dangerWarning}>
              <AlertTriangle size={16} color={COLORS.danger} strokeWidth={1.75} />
              <Text style={s.dangerWarningText}>
                Once deleted, your account cannot be recovered. All matches, messages, and data will be permanently erased.
              </Text>
            </View>
            <View style={s.dangerDivider} />
            <Pressable
              onPress={() => setShowDeleteConfirm(true)}
              style={s.dangerBtn}
            >
              <Trash2 size={18} color={COLORS.danger} strokeWidth={1.75} />
              <Text style={s.dangerBtnText}>Delete Account</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Delete Confirmation Modal ── */}
        <Modal
          visible={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Account?"
        >
          <Text style={s.deleteModalBody}>
            This action is permanent and cannot be undone. All your data,
            matches, messages, and group memberships will be permanently
            removed.
          </Text>
          <View style={s.deleteModalActions}>
            <View style={{ flex: 1 }}>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onPress={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button variant="danger" size="sm" fullWidth>
                Delete Forever
              </Button>
            </View>
          </View>
        </Modal>

        {/* Sub-pages */}
        {showChangePassword && (
          <ChangePasswordPage onClose={() => setShowChangePassword(false)} />
        )}
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

AccountSettingsPage.displayName = "AccountSettingsPage";

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

  // Profile Summary Card
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E2E8F0",
  },
  profileAvatarRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: COLORS.secondary,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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

  // Section group (card-like container)
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
  menuItemSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  menuItemValue: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginRight: 4,
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

  // Danger zone
  dangerGroup: {
    borderWidth: 1,
    borderColor: "rgba(229,62,62,0.2)",
  },
  dangerWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 2,
  },
  dangerWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: "rgba(229,62,62,0.12)",
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    justifyContent: "center",
    minHeight: 48,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.danger,
    fontFamily: "Inter_600SemiBold",
  },

  // Delete confirmation modal
  deleteModalBody: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 8,
  },
});
