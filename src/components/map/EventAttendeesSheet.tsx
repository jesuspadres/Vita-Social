import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  Modal as RNModal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AttendeeStatus = "going" | "maybe" | "declined";

export interface EventAttendee {
  id: string;
  name: string;
  avatar_url: string | null;
  status: AttendeeStatus;
}

export interface EventAttendeesSheetProps {
  visible: boolean;
  onClose: () => void;
  attendees: EventAttendee[];
  totalCount: number;
}

type FilterTab = "all" | "going" | "maybe" | "declined";

// ---------------------------------------------------------------------------
// Mock Attendees
// ---------------------------------------------------------------------------

export const MOCK_EVENT_ATTENDEES: EventAttendee[] = [
  { id: "att-1", name: "Sarah Chen", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=SarahChen", status: "going" },
  { id: "att-2", name: "Marcus Rivera", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=MarcusRivera", status: "going" },
  { id: "att-3", name: "Elena Volkov", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=ElenaVolkov", status: "going" },
  { id: "att-4", name: "David Park", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=DavidPark", status: "maybe" },
  { id: "att-5", name: "Amara Johnson", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=AmaraJohnson", status: "going" },
  { id: "att-6", name: "James Wu", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=JamesWu", status: "declined" },
  { id: "att-7", name: "Lina Hernandez", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=LinaHernandez", status: "going" },
  { id: "att-8", name: "Ryan O'Brien", avatar_url: "https://api.dicebear.com/9.x/avataaars/svg?seed=RyanOBrien", status: "maybe" },
];

// ---------------------------------------------------------------------------
// Status Badge Colors
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<AttendeeStatus, { bg: string; text: string; label: string }> = {
  going: { bg: "rgba(56,161,105,0.1)", text: "#38A169", label: "Going" },
  maybe: { bg: "rgba(214,158,46,0.1)", text: "#D69E2E", label: "Maybe" },
  declined: { bg: "rgba(229,62,62,0.1)", text: "#E53E3E", label: "Declined" },
};

// ---------------------------------------------------------------------------
// Filter Tabs
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "going", label: "Going" },
  { key: "maybe", label: "Maybe" },
  { key: "declined", label: "Declined" },
];

// ---------------------------------------------------------------------------
// Attendee Row
// ---------------------------------------------------------------------------

function AttendeeRow({ attendee }: { attendee: EventAttendee }) {
  const statusStyle = STATUS_STYLES[attendee.status];

  return (
    <View style={styles.attendeeRow}>
      {attendee.avatar_url ? (
        <Image
          source={{ uri: attendee.avatar_url }}
          style={styles.attendeeAvatar}
        />
      ) : (
        <View style={[styles.attendeeAvatar, { backgroundColor: "#E2E8F0" }]} />
      )}
      <Text style={styles.attendeeName} numberOfLines={1}>
        {attendee.name}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
          {statusStyle.label}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventAttendeesSheet({
  visible,
  onClose,
  attendees,
  totalCount,
}: EventAttendeesSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const filteredAttendees = useMemo(() => {
    if (activeFilter === "all") return attendees;
    return attendees.filter((a) => a.status === activeFilter);
  }, [attendees, activeFilter]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(250)}
          style={styles.backdropFill}
        />
      </Pressable>

      {/* Panel */}
      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={[
          styles.panel,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandle}>
          <View style={styles.dragBar} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Attendees</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{totalCount}</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={8}
          >
            <X size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[
                styles.filterTab,
                activeFilter === tab.key
                  ? styles.filterTabActive
                  : styles.filterTabInactive,
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === tab.key
                    ? styles.filterTabTextActive
                    : styles.filterTabTextInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Attendee List */}
        <FlatList
          data={filteredAttendees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AttendeeRow attendee={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
    </RNModal>
  );
}

EventAttendeesSheet.displayName = "EventAttendeesSheet";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropFill: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    overflow: "hidden",
  },
  dragHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitleRow: {
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
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 44,
    justifyContent: "center",
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabInactive: {
    backgroundColor: "transparent",
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterTabTextActive: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
  filterTabTextInactive: {
    fontWeight: "500",
    color: "#6B7280",
  },

  // Attendee list
  listContent: {
    paddingBottom: 16,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  attendeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  attendeeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
