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
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Tag,
  Type,
  Users,
  UserMinus,
  Bell,
  MessageSquare,
  Calendar,
  LogOut,
  Trash2,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { COLORS } from "@/lib/constants";
import { EditGroupInfoSheet } from "@/components/groups/EditGroupInfoSheet";
import { MemberRequestsPage } from "@/components/groups/MemberRequestsPage";
import { InviteMembersSheet } from "@/components/groups/InviteMembersSheet";
import { RemoveMembersPage } from "@/components/groups/RemoveMembersPage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

type PrivacyLevel = "public" | "private" | "secret";

export interface GroupSettingsPageProps {
  group: {
    id: string;
    name: string;
    description?: string;
    privacy_tier: string;
    member_count: number;
    cover_image?: string;
  };
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Group Header Card
// ---------------------------------------------------------------------------

function GroupHeaderCard({
  group,
}: {
  group: GroupSettingsPageProps["group"];
}) {
  return (
    <View style={s.groupHeaderCard}>
      {/* Cover image or placeholder */}
      <View style={s.groupCoverContainer}>
        {group.cover_image ? (
          <Image
            source={{ uri: group.cover_image }}
            style={s.groupCoverImage}
          />
        ) : (
          <View style={s.groupCoverPlaceholder}>
            <Users size={28} color="#FFFFFF" strokeWidth={1.75} />
          </View>
        )}
      </View>
      {/* Group name */}
      <Text style={s.groupHeaderName} numberOfLines={1}>
        {group.name}
      </Text>
      {/* Member count pill */}
      <View style={s.memberCountPill}>
        <Users size={12} color={COLORS.secondary} strokeWidth={2} />
        <Text style={s.memberCountText}>
          {group.member_count} members
        </Text>
      </View>
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
  subtitle,
  value,
  onPress,
  danger,
  showChevron = true,
}: {
  Icon?: LucideIcon;
  label: string;
  subtitle?: string;
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
// Privacy Level Selector
// ---------------------------------------------------------------------------

function PrivacyLevelSelector({
  value,
  onChange,
}: {
  value: PrivacyLevel;
  onChange: (v: PrivacyLevel) => void;
}) {
  const options: { key: PrivacyLevel; label: string }[] = [
    { key: "public", label: "Public" },
    { key: "private", label: "Private" },
    { key: "secret", label: "Secret" },
  ];

  return (
    <View style={s.privacySection}>
      <Text style={s.toggleLabel}>Privacy Level</Text>
      <View style={s.privacyBtnRow}>
        {options.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              s.privacyBtn,
              value === opt.key
                ? s.privacyBtnActive
                : s.privacyBtnInactive,
            ]}
          >
            <Text
              style={[
                s.privacyBtnText,
                value === opt.key
                  ? s.privacyBtnTextActive
                  : s.privacyBtnTextInactive,
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
// Main Component
// ---------------------------------------------------------------------------

export function GroupSettingsPage({ group, onClose }: GroupSettingsPageProps) {
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

  // State
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(
    group.privacy_tier as PrivacyLevel,
  );
  const [groupNotifications, setGroupNotifications] = useState(true);
  const [postNotifications, setPostNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);

  // Modals
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sub-pages / sheets
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showMemberRequests, setShowMemberRequests] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [showRemoveMembers, setShowRemoveMembers] = useState(false);

  // Determine category label for display
  const categoryLabel = "Outdoors";

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
            <Text style={s.headerTitle}>Group Settings</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Group Header Card ── */}
            <GroupHeaderCard group={group} />

            {/* GROUP INFO */}
            <SectionHeader title="GROUP INFO" />
            <View style={s.sectionGroup}>
              <MenuItem Icon={Type} label="Group Name" value={group.name} onPress={() => setShowEditInfo(true)} />
              <View style={s.itemDivider} />
              <MenuItem Icon={FileText} label="Description" value="Edit" onPress={() => setShowEditInfo(true)} />
              <View style={s.itemDivider} />
              <MenuItem Icon={Tag} label="Category" value={categoryLabel} onPress={() => setShowEditInfo(true)} />
              <View style={s.itemDivider} />
              <MenuItem Icon={ImageIcon} label="Cover Photo" value="Change" onPress={() => setShowEditInfo(true)} />
            </View>

            {/* PRIVACY */}
            <SectionHeader title="PRIVACY" />
            <View style={s.sectionGroup}>
              <PrivacyLevelSelector
                value={privacyLevel}
                onChange={setPrivacyLevel}
              />
            </View>

            {/* MEMBERS */}
            <SectionHeader title="MEMBERS" />
            <View style={s.sectionGroup}>
              <MenuItem
                Icon={Users}
                label="Member Requests"
                subtitle="Review pending requests"
                value="3 pending"
                onPress={() => setShowMemberRequests(true)}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={Users}
                label="Invite Members"
                subtitle="Share a link or search"
                onPress={() => setShowInviteMembers(true)}
              />
              <View style={s.itemDivider} />
              <MenuItem
                Icon={UserMinus}
                label="Remove Members"
                subtitle="Remove from this group"
                onPress={() => setShowRemoveMembers(true)}
              />
            </View>

            {/* NOTIFICATIONS */}
            <SectionHeader title="NOTIFICATIONS" />
            <View style={s.sectionGroup}>
              <ToggleItem
                Icon={Bell}
                label="Group Notifications"
                enabled={groupNotifications}
                onToggle={() => setGroupNotifications((p) => !p)}
              />
              <View style={s.itemDivider} />
              <ToggleItem
                Icon={MessageSquare}
                label="Post Notifications"
                enabled={postNotifications}
                onToggle={() => setPostNotifications((p) => !p)}
              />
              <View style={s.itemDivider} />
              <ToggleItem
                Icon={Calendar}
                label="Event Notifications"
                enabled={eventNotifications}
                onToggle={() => setEventNotifications((p) => !p)}
              />
            </View>

            {/* DANGER ZONE */}
            <SectionHeader title="DANGER ZONE" />
            <View style={s.sectionGroup}>
              <Pressable
                onPress={() => setShowLeaveConfirm(true)}
                style={s.menuItem}
              >
                <LogOut size={18} color={COLORS.danger} strokeWidth={1.75} />
                <Text style={s.dangerLabel}>Leave Group</Text>
              </Pressable>
              <View style={s.itemDivider} />
              <Pressable
                onPress={() => setShowDeleteConfirm(true)}
                style={s.menuItem}
              >
                <Trash2 size={18} color={COLORS.danger} strokeWidth={1.75} />
                <Text style={s.dangerLabel}>Delete Group</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Leave Confirmation Modal */}
          <Modal
            visible={showLeaveConfirm}
            onClose={() => setShowLeaveConfirm(false)}
            title="Leave Group?"
          >
            <Text style={s.modalBody}>
              Your health ring progress for this group will be lost. You can
              rejoin later but your streak will reset.
            </Text>
            <View style={s.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onPress={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="danger" size="sm" fullWidth>
                  Leave
                </Button>
              </View>
            </View>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            visible={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            title="Delete Group?"
          >
            <Text style={s.modalBody}>
              This action is permanent. All group data, posts, and events will
              be deleted for all members.
            </Text>
            <View style={s.modalActions}>
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
                  Delete
                </Button>
              </View>
            </View>
          </Modal>

          {/* Edit Group Info Sheet */}
          <EditGroupInfoSheet
            visible={showEditInfo}
            onClose={() => setShowEditInfo(false)}
            group={{
              name: group.name,
              description: group.description ?? "",
              category: categoryLabel,
              cover_url: group.cover_image ?? null,
            }}
          />

          {/* Invite Members Sheet */}
          <InviteMembersSheet
            visible={showInviteMembers}
            onClose={() => setShowInviteMembers(false)}
            groupName={group.name}
          />

          {/* Member Requests Page */}
          {showMemberRequests && (
            <MemberRequestsPage
              onClose={() => setShowMemberRequests(false)}
              groupName={group.name}
            />
          )}

          {/* Remove Members Page */}
          {showRemoveMembers && (
            <RemoveMembersPage
              onClose={() => setShowRemoveMembers(false)}
              groupName={group.name}
            />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

GroupSettingsPage.displayName = "GroupSettingsPage";

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

  // Group Header Card
  groupHeaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  groupCoverContainer: {
    width: 72,
    height: 72,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  groupCoverImage: {
    width: 72,
    height: 72,
  },
  groupCoverPlaceholder: {
    width: 72,
    height: 72,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  groupHeaderName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  memberCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74,144,164,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.secondary,
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
    minHeight: 44,
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

  // Privacy level selector
  privacySection: {
    paddingVertical: 14,
    gap: 10,
  },
  privacyBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  privacyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  privacyBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  privacyBtnInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  privacyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  privacyBtnTextActive: {
    color: "#FFFFFF",
  },
  privacyBtnTextInactive: {
    color: "#374151",
  },

  // Danger items
  dangerLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.danger,
    fontFamily: "Inter_600SemiBold",
  },

  // Modal
  modalBody: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
});
