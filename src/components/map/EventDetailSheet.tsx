import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Share2,
  CheckCircle,
  Calendar,
  Pencil,
} from "lucide-react-native";
import { format } from "date-fns";
import { MOCK_ATTENDEES, CURRENT_USER_ID, type MockEvent } from "@/lib/mock-data";
import { EventAttendeesSheet, MOCK_EVENT_ATTENDEES } from "@/components/map/EventAttendeesSheet";
import { EditEventSheet } from "@/components/map/EditEventSheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLive(event: MockEvent): boolean {
  const now = Date.now();
  return (
    new Date(event.starts_at).getTime() <= now &&
    new Date(event.ends_at).getTime() > now
  );
}

const VISIBILITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  public: { label: "Public", color: "#4A90A4", bg: "rgba(74,144,164,0.12)" },
  group: { label: "Group", color: "#1A365D", bg: "rgba(26,54,93,0.1)" },
  friends: { label: "Friends", color: "#38A169", bg: "rgba(56,161,105,0.12)" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EventDetailSheetProps {
  event: MockEvent | null;
  onClose: () => void;
  onCheckIn: (event: MockEvent) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventDetailSheet({ event, onClose, onCheckIn }: EventDetailSheetProps) {
  const [showAttendees, setShowAttendees] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);

  if (!event) return null;

  const isHost = event.host.id === CURRENT_USER_ID || event.host.name === "Maya Chen";

  const live = isLive(event);
  const vis = VISIBILITY_LABELS[event.visibility] ?? VISIBILITY_LABELS.public;

  const startTime = format(new Date(event.starts_at), "h:mm a");
  const endTime = format(new Date(event.ends_at), "h:mm a");
  const dateStr = format(new Date(event.starts_at), "EEE, MMM d");

  const capacityPercent = event.max_capacity
    ? Math.min((event.attendee_count / event.max_capacity) * 100, 100)
    : 0;

  // Attendees to show (first 5)
  const displayAttendees = MOCK_ATTENDEES.slice(0, 5);
  const extraAttendees = Math.max(0, event.attendee_count - displayAttendees.length);

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View style={styles.sheetContainer}>
        <SafeAreaView edges={["bottom"]} style={styles.sheetSafe}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Title + Close */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <X size={20} color="#4A5568" />
              </Pressable>
            </View>

            {/* Status Badges */}
            <View style={styles.badgeRow}>
              {live && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                </View>
              )}
              <View style={[styles.visBadge, { backgroundColor: vis.bg }]}>
                <Text style={[styles.visBadgeText, { color: vis.color }]}>
                  {vis.label}
                </Text>
              </View>
            </View>

            {/* Host info */}
            <View style={styles.hostRow}>
              {event.host.avatar_url ? (
                <Image
                  source={{ uri: event.host.avatar_url }}
                  style={styles.hostAvatar}
                />
              ) : (
                <View style={[styles.hostAvatar, { backgroundColor: "#E2E8F0" }]} />
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.hostNameRow}>
                  <Text style={styles.hostName}>{event.host.name}</Text>
                  {event.host.verified && (
                    <ShieldCheck size={14} color="#3182CE" style={{ marginLeft: 4 }} />
                  )}
                </View>
                <Text style={styles.hostLabel}>Host</Text>
              </View>
            </View>

            {/* Time */}
            <View style={styles.infoRow}>
              <Clock size={18} color="#4A90A4" />
              <View>
                <Text style={styles.infoMain}>{dateStr}</Text>
                <Text style={styles.infoSub}>
                  {startTime} - {endTime}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.infoRow}>
              <MapPin size={18} color="#4A90A4" />
              <View>
                <Text style={styles.infoMain}>{event.location_name}</Text>
                <Text style={styles.infoSub}>{event.distance} mi away</Text>
              </View>
            </View>

            {/* Capacity Bar */}
            {event.max_capacity && (
              <View style={styles.capacitySection}>
                <View style={styles.capacityHeader}>
                  <Text style={styles.capacityLabel}>Capacity</Text>
                  <Text style={styles.capacityCount}>
                    {event.attendee_count}/{event.max_capacity}
                  </Text>
                </View>
                <View style={styles.capacityBarBg}>
                  <View
                    style={[
                      styles.capacityBarFill,
                      {
                        width: `${capacityPercent}%` as unknown as number,
                        backgroundColor:
                          capacityPercent >= 90 ? "#E53E3E" : "#4A90A4",
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Stacked Attendee Avatars */}
            <Pressable
              onPress={() => setShowAttendees(true)}
              style={styles.attendeesRow}
            >
              {displayAttendees.map((attendee, i) => (
                <Image
                  key={attendee.id}
                  source={{ uri: attendee.avatar_url ?? undefined }}
                  style={[
                    styles.attendeeAvatar,
                    { marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i },
                  ]}
                />
              ))}
              {extraAttendees > 0 && (
                <View style={[styles.attendeeExtra, { marginLeft: -10 }]}>
                  <Text style={styles.attendeeExtraText}>+{extraAttendees}</Text>
                </View>
              )}
              <Text style={styles.viewAllText}>View all &rarr;</Text>
            </Pressable>

            {/* Description */}
            <Text style={styles.description}>{event.description}</Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {live && (
              <Pressable
                style={styles.checkInBtn}
                onPress={() => onCheckIn(event)}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.checkInText}>Check In</Text>
              </Pressable>
            )}
            {isHost && (
              <Pressable
                style={styles.editBtn}
                onPress={() => setShowEditEvent(true)}
              >
                <Pencil size={18} color="#4A90A4" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.rsvpBtn, live && { flex: 1 }]}
            >
              <Calendar size={18} color="#4A90A4" />
              <Text style={styles.rsvpText}>RSVP</Text>
            </Pressable>
            <Pressable
              style={styles.shareBtn}
              onPress={async () => {
                try {
                  await Share.share({
                    message: `Check out "${event.title}" on Vita!\n${event.location_name}\n${new Date(event.starts_at).toLocaleDateString()}`,
                  });
                } catch {}
              }}
            >
              <Share2 size={18} color="#4A5568" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <EventAttendeesSheet
        visible={showAttendees}
        onClose={() => setShowAttendees(false)}
        attendees={MOCK_EVENT_ATTENDEES}
        totalCount={event.attendee_count}
      />

      <EditEventSheet
        visible={showEditEvent}
        onClose={() => setShowEditEvent(false)}
        event={{
          title: event.title,
          description: event.description,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          location_name: event.location_name,
          visibility: event.visibility,
          max_capacity: event.max_capacity,
        }}
      />
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetSafe: {
    flex: 1,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E0",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  // Title row
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  // Badges
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(229,62,62,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E53E3E",
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E53E3E",
    fontFamily: "Inter_700Bold",
  },
  visBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  visBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Host
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  hostNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hostName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D3748",
    fontFamily: "Inter_600SemiBold",
  },
  hostLabel: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    fontFamily: "Inter_600SemiBold",
  },
  infoSub: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  // Capacity
  capacitySection: {
    marginBottom: 16,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  capacityLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A5568",
    fontFamily: "Inter_500Medium",
  },
  capacityCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2D3748",
    fontFamily: "Inter_600SemiBold",
  },
  capacityBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EDF2F7",
    overflow: "hidden",
  },
  capacityBarFill: {
    height: 6,
    borderRadius: 3,
  },
  // Attendees
  attendeesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  attendeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  attendeeExtra: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  attendeeExtraText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4A5568",
    fontFamily: "Inter_700Bold",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90A4",
    fontFamily: "Inter_600SemiBold",
    marginLeft: 8,
  },
  // Description
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
  },
  // Actions
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  checkInBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#38A169",
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(74,144,164,0.1)",
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3A7487",
    fontFamily: "Inter_600SemiBold",
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(74,144,164,0.1)",
  },
  rsvpText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3A7487",
    fontFamily: "Inter_600SemiBold",
  },
  shareBtn: {
    width: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F7FAFC",
  },
});

EventDetailSheet.displayName = "EventDetailSheet";
