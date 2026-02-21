import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
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
  Search,
  ChevronRight,
  Mail,
  HelpCircle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { COLORS } from "@/lib/constants";
import { FAQDetailPage } from "@/components/profile/FAQDetailPage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// FAQ Data
// ---------------------------------------------------------------------------

interface FAQSection {
  title: string;
  items: string[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: "GETTING STARTED",
    items: [
      "How does matching work?",
      "How to set up my profile?",
      "What is the health ring?",
    ],
  },
  {
    title: "SAFETY & PRIVACY",
    items: [
      "How to block someone",
      "How to report a user",
      "Who can see my profile?",
    ],
  },
  {
    title: "EVENTS & GROUPS",
    items: [
      "How to create an event",
      "How does check-in work?",
      "What happens if I miss an event?",
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      "How to delete my account",
      "How to change my email",
      "How to reset my password",
    ],
  },
];

// ---------------------------------------------------------------------------
// FAQ Answers
// ---------------------------------------------------------------------------

const FAQ_ANSWERS: Record<string, string> = {
  "How does matching work?":
    "Vita uses a swipe-based discovery system similar to other social apps, but with a twist focused on real-world connection. When you see a profile you're interested in, swipe right to like or left to pass. If both people swipe right on each other, it's a match!\n\nOnce matched, you can start a conversation and begin planning your first real-world meetup. Vita's matching algorithm takes into account your interests, location, and activity level to surface the most compatible people near you.\n\nUnlike other platforms, Vita rewards users who actually meet in person. Your match quality improves as you attend more events and check in at real locations, because active community members are prioritized in the discovery feed.",

  "How to set up my profile?":
    "Setting up your Vita profile is quick and straightforward. Start by adding at least one photo -- we recommend uploading 3-6 photos that showcase your personality and interests. Your main photo is the first thing potential matches will see, so choose one that represents you well.\n\nNext, write a short bio that tells others what you're about. Keep it authentic and mention any hobbies or activities you enjoy. You can also add your interests by selecting from our curated list of tags, which helps the matching algorithm connect you with like-minded people.\n\nFinally, review your privacy settings to control who can see your profile and how your location is displayed. You can always edit your profile later by tapping the 'Edit Profile' button on your profile page.",

  "What is the health ring?":
    "The health ring is Vita's unique system for tracking your real-world engagement within groups. It appears as a colored ring around group avatars and reflects how recently you've attended an in-person event or check-in for that group.\n\nThe ring follows a 45-day health period with color stages: Green (1-30 days) means you're an active member, Yellow (31-37 days) indicates you're cooling off, Orange (38-42 days) means you're at risk, Red (43-45 days) is critical, and Gray (46+ days) means inactive.\n\nThe purpose of the health ring is to encourage consistent real-world participation. Groups with healthier rings are more vibrant communities. If your ring starts to fade, attending an event will reset it back to green. This system ensures that Vita groups remain active, engaged communities rather than dormant online spaces.",

  "How to block someone":
    "If you encounter someone who makes you uncomfortable, you can block them quickly and discreetly. Navigate to the person's profile or open your conversation with them, then tap the three-dot menu in the top right corner and select 'Block User.'\n\nWhen you block someone, they will no longer be able to see your profile, send you messages, or find you in discovery. They will not be notified that you've blocked them. Any existing conversations between you will be hidden from both sides.\n\nIf you accidentally block someone, you can manage your blocked users list from Settings > Privacy & Safety > Blocked Users. From there, you can unblock anyone you'd like to reconnect with.",

  "How to report a user":
    "Vita takes safety seriously, and we encourage you to report any behavior that violates our community guidelines. To report a user, go to their profile or your conversation with them, tap the three-dot menu, and select 'Report User.'\n\nYou'll be asked to choose a category for your report (such as harassment, fake profile, inappropriate content, or spam) and provide a brief description of the issue. Adding specific details helps our safety team investigate more effectively.\n\nAll reports are reviewed by our trust and safety team, typically within 24 hours. Your report is completely confidential -- the reported user will not know who filed the report. If the reported user is found to be in violation of our guidelines, appropriate action will be taken, ranging from a warning to a permanent ban.",

  "Who can see my profile?":
    "Your profile visibility depends on your privacy settings, which you can customize at any time from Settings > Privacy & Safety. By default, your profile is visible to other Vita users in your area who meet your preference criteria (age range, distance, etc.).\n\nYou can toggle the 'Discoverable' setting to hide your profile from the discovery feed entirely. When discoverable is off, only people you've already matched with can see your profile. Your online status visibility can also be controlled independently.\n\nLocation precision gives you three options: Exact (shows your precise location), Approximate (shows a general area), or Hidden (doesn't display location at all). We recommend using 'Approximate' for the best balance of privacy and functionality.",

  "How to create an event":
    "Creating an event on Vita is a great way to bring your community together for real-world meetups. Navigate to the Map tab, then tap the '+' button or 'Create Event' option. You'll need to provide a title, description, date and time, location, and optionally a category and capacity limit.\n\nChoose a location by either searching for a venue or dropping a pin on the map. You can set a check-in radius (default is 1 mile) which determines how close attendees need to be to verify their attendance via GPS check-in.\n\nOnce created, your event will appear on the map for nearby users and can be shared to specific groups. As the host, you'll receive notifications when people RSVP and when they check in at the event.",

  "How does check-in work?":
    "GPS check-in is Vita's way of verifying that you actually attended an event in person. When you arrive at an event location, open the event details and tap the 'Check In' button. The app will use your device's GPS to confirm you're within the check-in radius of the event location.\n\nSuccessful check-ins contribute to your health ring status for the associated group, keeping your ring green and active. They also appear on your profile's check-in timeline, showing others that you're an active community member.\n\nCheck-in is only available during the event's scheduled time window (from the start time to the end time). If you're having trouble checking in, make sure your location services are enabled and that you're within the specified radius of the event.",

  "What happens if I miss an event?":
    "Missing an event you RSVP'd to won't result in any penalties, but it does mean you'll miss out on the benefits of checking in. Your health ring for the associated group will continue its normal countdown, which means it may start to change color if you haven't attended a recent event.\n\nIf you know you can't make it to an event, it's courteous to update your RSVP so the host and other attendees have accurate headcounts. You can do this from the event details page by tapping 'Cancel RSVP.'\n\nRemember, the health ring system is designed to encourage consistent participation, not to punish occasional absences. Even if your ring has cooled off, attending just one event will reset it back to green. Life happens, and Vita understands that.",

  "How to delete my account":
    "If you decide to leave Vita, you can delete your account from Settings > Account > Danger Zone > Delete Account. This action is permanent and cannot be undone. Before proceeding, please understand what will be deleted.\n\nAll of your data will be permanently erased, including your profile information, photos, matches, messages, group memberships, event history, and check-in records. None of this data can be recovered after deletion.\n\nAfter tapping 'Delete Account,' you'll be asked to confirm your decision. Once confirmed, your account will be immediately deactivated and your data will be queued for permanent deletion. If you change your mind, you would need to create a brand new account from scratch.",

  "How to change my email":
    "To update your email address, navigate to Settings > Account. You'll see your current email listed under Personal Info. Tap on it to open the edit view where you can enter your new email address.\n\nAfter entering your new email, a verification link will be sent to the new address to confirm it's valid and belongs to you. Click the link in the verification email to complete the change. Your old email will no longer be associated with your account once the new one is verified.\n\nIf you don't receive the verification email within a few minutes, check your spam folder. You can also request a new verification link from the same settings page. For security purposes, you may be asked to re-enter your password when changing your email.",

  "How to reset my password":
    "If you've forgotten your password, you can reset it from the login screen by tapping 'Forgot Password?' Enter the email address or phone number associated with your account, and we'll send you a reset link or code.\n\nIf you're already logged in and want to change your password, go to Settings > Account > Security > Change Password. You'll need to enter your current password first, then choose a new one that meets our security requirements: at least 8 characters, one uppercase letter, one number, and one special character.\n\nFor your security, we recommend using a unique password that you don't use for other accounts. After changing your password, you may be asked to log in again on other devices where you were previously signed in.",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HelpCenterPageProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

function MenuItem({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.menuItem}>
      <Text style={s.menuItemLabel}>{label}</Text>
      <ChevronRight size={16} color="#CBD5E0" />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HelpCenterPage({ onClose }: HelpCenterPageProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFAQ, setSelectedFAQ] = useState<{ question: string; answer: string } | null>(null);

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

  // Filter FAQs based on search query
  const filteredSections = searchQuery.trim()
    ? FAQ_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((section) => section.items.length > 0)
    : FAQ_SECTIONS;

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
            <Text style={s.headerTitle}>Help Center</Text>
            <View style={s.headerSpacer} />
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search Bar */}
            <View style={s.searchBar}>
              <Search size={18} color="#A0AEC0" />
              <TextInput
                style={s.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for help..."
                placeholderTextColor="#A0AEC0"
              />
            </View>

            {/* FAQ Sections */}
            {filteredSections.map((section) => (
              <React.Fragment key={section.title}>
                <SectionHeader title={section.title} />
                <View style={s.sectionGroup}>
                  {section.items.map((item, index) => (
                    <React.Fragment key={item}>
                      <MenuItem
                        label={item}
                        onPress={() =>
                          setSelectedFAQ({
                            question: item,
                            answer: FAQ_ANSWERS[item] ?? "",
                          })
                        }
                      />
                      {index < section.items.length - 1 && (
                        <View style={s.itemDivider} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </React.Fragment>
            ))}

            {/* No results */}
            {filteredSections.length === 0 && searchQuery.trim().length > 0 && (
              <View style={s.emptyContainer}>
                <View style={s.emptyIconCircle}>
                  <HelpCircle size={32} color={COLORS.secondary} />
                </View>
                <Text style={s.emptyTitle}>No results found</Text>
                <Text style={s.emptyDesc}>
                  Try different keywords or contact our support team below.
                </Text>
              </View>
            )}

            {/* Contact Section */}
            <View style={s.contactCard}>
              <Text style={s.contactTitle}>Still need help?</Text>
              <Text style={s.contactDesc}>
                Our support team is available 24/7 to assist you with any
                questions or concerns.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  s.contactBtn,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Mail size={16} color="#FFFFFF" />
                <Text style={s.contactBtnText}>Contact Support</Text>
              </Pressable>
              <Text style={s.contactEmail}>support@vitaapp.com</Text>
            </View>
          </ScrollView>
        {/* FAQ Detail sub-page */}
        {selectedFAQ && (
          <FAQDetailPage
            question={selectedFAQ.question}
            answer={selectedFAQ.answer}
            onClose={() => setSelectedFAQ(null)}
          />
        )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

HelpCenterPage.displayName = "HelpCenterPage";

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
    paddingTop: 16,
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2D3748",
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
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
    marginLeft: 0,
  },

  // Menu item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    fontFamily: "Inter_500Medium",
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
    backgroundColor: "rgba(74,144,164,0.1)",
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

  // Contact card
  contactCard: {
    marginTop: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A2D3D",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  contactDesc: {
    fontSize: 13,
    color: "#718096",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 44,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  contactEmail: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginTop: 10,
  },
});
