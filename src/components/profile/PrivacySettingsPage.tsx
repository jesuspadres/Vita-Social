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
  Eye,
  MapPin,
  Wifi,
  BookOpen,
  Ban,
  ChevronRight,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

export interface PrivacySettingsPageProps {
  onClose: () => void;
  onOpenBlockedUsers: () => void;
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
// Toggle Item (with optional help text)
// ---------------------------------------------------------------------------

function ToggleItem({
  Icon,
  label,
  helpText,
  enabled,
  onToggle,
}: {
  Icon?: LucideIcon;
  label: string;
  helpText?: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={s.toggleItem}>
      {Icon && <Icon size={18} color="#718096" strokeWidth={1.75} />}
      <View style={s.toggleTextContainer}>
        <Text style={s.toggleLabel}>{label}</Text>
        {helpText && (
          <Text style={s.toggleHelpText}>{helpText}</Text>
        )}
      </View>
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
        <View style={s.locationHeaderTextContainer}>
          <Text style={s.toggleLabel}>Location Precision</Text>
          <Text style={s.locationDescription}>
            Controls how precisely your location is shared
          </Text>
        </View>
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
// Main Component
// ---------------------------------------------------------------------------

export function PrivacySettingsPage({
  onClose,
  onOpenBlockedUsers,
}: PrivacySettingsPageProps) {
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

  // Discovery
  const [discoverable, setDiscoverable] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  // Location
  const [locationPrecision, setLocationPrecision] =
    useState<LocationPrecision>("approximate");

  // Visibility
  const [showOnline, setShowOnline] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

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
          <Text style={s.headerTitle}>Privacy & Safety</Text>
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
          {/* ── Discovery ── */}
          <SectionHeader title="DISCOVERY" />
          <View style={s.sectionGroup}>
            <ToggleItem
              Icon={Eye}
              label="Discoverable"
              helpText="When off, your profile won't appear in others' discovery feed"
              enabled={discoverable}
              onToggle={() => setDiscoverable((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              label="Show Age"
              helpText="Your age will be visible on your profile card"
              enabled={showAge}
              onToggle={() => setShowAge((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              label="Show Distance"
              helpText="Others can see how far you are from them"
              enabled={showDistance}
              onToggle={() => setShowDistance((p) => !p)}
            />
          </View>

          {/* ── Location ── */}
          <SectionHeader title="LOCATION" />
          <View style={s.sectionGroup}>
            <LocationPrecisionSelector
              value={locationPrecision}
              onChange={setLocationPrecision}
            />
          </View>

          {/* ── Visibility ── */}
          <SectionHeader title="VISIBILITY" />
          <View style={s.sectionGroup}>
            <ToggleItem
              Icon={Wifi}
              label="Show Online Status"
              helpText="Green dot shown next to your name when active"
              enabled={showOnline}
              onToggle={() => setShowOnline((p) => !p)}
            />
            <View style={s.itemDivider} />
            <ToggleItem
              Icon={BookOpen}
              label="Read Receipts"
              helpText="Others can see when you've read their messages"
              enabled={readReceipts}
              onToggle={() => setReadReceipts((p) => !p)}
            />
          </View>

          {/* ── Safety ── */}
          <SectionHeader title="SAFETY" />
          <View style={s.sectionGroup}>
            <MenuItem
              Icon={Ban}
              label="Blocked Users"
              value="2 users"
              onPress={onOpenBlockedUsers}
            />
          </View>
        </ScrollView>
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

PrivacySettingsPage.displayName = "PrivacySettingsPage";

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
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
  },
  toggleHelpText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
  },

  // Location precision
  locationSection: {
    paddingVertical: 14,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  locationHeaderTextContainer: {
    flex: 1,
  },
  locationDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
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
});
