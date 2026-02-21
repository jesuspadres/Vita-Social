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
  Phone,
  Mail,
  Eye,
  MapPin,
  Wifi,
  BookOpen,
  Bell,
  MessageSquare,
  Users,
  Calendar,
  Crown,
  HelpCircle,
  Flag,
  FileText,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { COLORS } from "@/lib/constants";
import { AccountSettingsPage } from "@/components/profile/AccountSettingsPage";
import { PrivacySettingsPage } from "@/components/profile/PrivacySettingsPage";
import { NotificationSettingsPage } from "@/components/profile/NotificationSettingsPage";
import { BlockedUsersPage } from "@/components/profile/BlockedUsersPage";
import { LegalPage } from "@/components/legal/LegalPage";
import { HelpCenterPage } from "@/components/profile/HelpCenterPage";
import { GoldSubscriptionPage } from "@/components/profile/GoldSubscriptionPage";
import { ReportProblemSheet } from "@/components/profile/ReportProblemSheet";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface SettingsPageProps {
  onClose: () => void;
}

type LocationPrecision = "exact" | "approximate" | "hidden";

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
        {value && <Text style={s.menuItemValue}>{value}</Text>}
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
// Location Precision Selector
// ---------------------------------------------------------------------------

function LocationPrecisionSelector({
  value,
  onChange,
}: {
  value: LocationPrecision;
  onChange: (v: LocationPrecision) => void;
}) {
  const options: { key: LocationPrecision; label: string }[] = [
    { key: "exact", label: "Exact" },
    { key: "approximate", label: "Approximate" },
    { key: "hidden", label: "Hidden" },
  ];

  return (
    <View style={s.locationSection}>
      <View style={s.locationHeader}>
        <MapPin size={18} color="#718096" strokeWidth={1.75} />
        <Text style={s.toggleLabel}>Location Precision</Text>
      </View>
      <View style={s.locationBtnRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              s.locationBtn,
              value === opt.key
                ? s.locationBtnActive
                : s.locationBtnInactive,
            ]}
          >
            <Text
              style={[
                s.locationBtnText,
                value === opt.key
                  ? s.locationBtnTextActive
                  : s.locationBtnTextInactive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Component
// ---------------------------------------------------------------------------

export function SettingsPage({ onClose }: SettingsPageProps) {
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

  // Privacy
  const [discoverable, setDiscoverable] = useState(true);
  const [locationPrecision, setLocationPrecision] =
    useState<LocationPrecision>("approximate");
  const [showOnline, setShowOnline] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [groupUpdates, setGroupUpdates] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sub-pages
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showLegal, setShowLegal] = useState<"terms" | "privacy" | "guidelines" | null>(null);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showGoldSubscription, setShowGoldSubscription] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);

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
          <Text style={s.headerTitle}>Settings</Text>
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
          {/* ── Account ── */}
          <SectionHeader title="ACCOUNT" />
          <View style={s.sectionGroup}>
            <MenuItem Icon={Phone} label="Phone Number" value="***-***-4528" onPress={() => setShowAccountSettings(true)} />
            <View style={s.itemDivider} />
            <MenuItem Icon={Mail} label="Email" value="Add email" onPress={() => setShowAccountSettings(true)} />
          </View>

          {/* ── Privacy ── */}
          <SectionHeader title="PRIVACY" />
          <View style={s.sectionGroup}>
            <MenuItem Icon={Shield} label="Privacy & Safety" onPress={() => setShowPrivacySettings(true)} />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Eye}
              label="Discoverable"
              enabled={discoverable}
              onToggle={() => setDiscoverable((p) => !p)}
            />
            <View style={s.itemDivider} />
            <LocationPrecisionSelector
              value={locationPrecision}
              onChange={setLocationPrecision}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Wifi}
              label="Show Online Status"
              enabled={showOnline}
              onToggle={() => setShowOnline((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={BookOpen}
              label="Read Receipts"
              enabled={readReceipts}
              onToggle={() => setReadReceipts((p) => !p)}
            />
          </View>

          {/* ── Notifications ── */}
          <SectionHeader title="NOTIFICATIONS" />
          <View style={s.sectionGroup}>
            <MenuItem Icon={Bell} label="Notification Settings" onPress={() => setShowNotificationSettings(true)} />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Bell}
              label="Push Notifications"
              enabled={pushEnabled}
              onToggle={() => setPushEnabled((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              label="Match Alerts"
              enabled={matchAlerts}
              onToggle={() => setMatchAlerts((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={MessageSquare}
              label="Message Alerts"
              enabled={messageAlerts}
              onToggle={() => setMessageAlerts((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Users}
              label="Group Updates"
              enabled={groupUpdates}
              onToggle={() => setGroupUpdates((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={Calendar}
              label="Event Reminders"
              enabled={eventReminders}
              onToggle={() => setEventReminders((p) => !p)}
            />
          </View>

          {/* ── Preferences ── */}
          <SectionHeader title="PREFERENCES" />
          <View style={s.sectionGroup}>
            <MenuItem
              label="Distance Range"
              value="1-50 mi"
              showChevron={false}
            />
            <View style={s.itemDivider} />
            <MenuItem
              label="Age Range"
              value="18-65"
              showChevron={false}
            />
          </View>

          {/* ── Subscription ── */}
          <SectionHeader title="SUBSCRIPTION" />
          <View style={s.sectionGroup}>
            <View style={s.subscriptionRow}>
              <Crown size={18} color="#718096" strokeWidth={1.75} />
              <Text style={s.toggleLabel}>Current Plan</Text>
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeText}>Free</Text>
              </View>
            </View>
            <View style={s.itemDivider} />
            <View style={s.subscriptionBtnWrapper}>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                iconLeft={<Crown size={14} color="#FFFFFF" />}
                onPress={() => setShowGoldSubscription(true)}
              >
                Upgrade to Gold
              </Button>
            </View>
          </View>

          {/* ── Support ── */}
          <SectionHeader title="SUPPORT" />
          <View style={s.sectionGroup}>
            <MenuItem Icon={HelpCircle} label="Help Center" onPress={() => setShowHelpCenter(true)} />
            <View style={s.itemDivider} />
            <MenuItem Icon={Flag} label="Report a Problem" onPress={() => setShowReportProblem(true)} />
            <View style={s.itemDivider} />
            <MenuItem Icon={FileText} label="Terms of Service" onPress={() => setShowLegal("terms")} />
            <View style={s.itemDivider} />
            <MenuItem Icon={Shield} label="Privacy Policy" onPress={() => setShowLegal("privacy")} />
            <View style={s.itemDivider} />
            <MenuItem Icon={BookOpen} label="Community Guidelines" onPress={() => setShowLegal("guidelines")} />
          </View>

          {/* ── Account Actions ── */}
          <SectionHeader title="ACCOUNT ACTIONS" />
          <View style={s.sectionGroup}>
            <Button
              variant="ghost"
              fullWidth
              iconLeft={<LogOut size={16} color={COLORS.danger} />}
            >
              <Text style={s.logoutText}>Log Out</Text>
            </Button>
          </View>

          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            style={s.deleteAccountBtn}
          >
            <Trash2 size={16} color="rgba(229,62,62,0.7)" />
            <Text style={s.deleteAccountText}>Delete Account</Text>
          </Pressable>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerVersion}>Vita v1.0.0</Text>
            <Text style={s.footerMade}>Made with care in Austin, TX</Text>
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

        {/* ── Sub-pages ── */}
        {showAccountSettings && (
          <AccountSettingsPage onClose={() => setShowAccountSettings(false)} />
        )}
        {showPrivacySettings && (
          <PrivacySettingsPage
            onClose={() => setShowPrivacySettings(false)}
            onOpenBlockedUsers={() => {
              setShowPrivacySettings(false);
              setShowBlockedUsers(true);
            }}
          />
        )}
        {showNotificationSettings && (
          <NotificationSettingsPage onClose={() => setShowNotificationSettings(false)} />
        )}
        {showBlockedUsers && (
          <BlockedUsersPage onClose={() => setShowBlockedUsers(false)} />
        )}
        {showLegal && (
          <LegalPage type={showLegal} onClose={() => setShowLegal(null)} />
        )}
        {showHelpCenter && (
          <HelpCenterPage onClose={() => setShowHelpCenter(false)} />
        )}
        {showGoldSubscription && (
          <GoldSubscriptionPage onClose={() => setShowGoldSubscription(false)} />
        )}

        {/* Bottom sheets */}
        <ReportProblemSheet
          visible={showReportProblem}
          onClose={() => setShowReportProblem(false)}
        />
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

SettingsPage.displayName = "SettingsPage";

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

  // Location precision
  locationSection: {
    paddingVertical: 14,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  locationBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 30,
  },
  locationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  locationBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  locationBtnInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  locationBtnTextActive: {
    color: "#FFFFFF",
  },
  locationBtnTextInactive: {
    color: "#374151",
  },

  // Subscription
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  freeBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter_600SemiBold",
  },
  subscriptionBtnWrapper: {
    paddingVertical: 12,
  },

  // Log out / Delete
  logoutText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  deleteAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
    minHeight: 48,
  },
  deleteAccountText: {
    fontSize: 14,
    color: "rgba(229,62,62,0.7)",
    fontFamily: "Inter_500Medium",
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

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 16,
  },
  footerVersion: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  footerMade: {
    fontSize: 10,
    color: "#CBD5E0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
