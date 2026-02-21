import React, { useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
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
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VELOCITY_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LegalPageType = "terms" | "privacy" | "guidelines";

export interface LegalPageProps {
  onClose: () => void;
  type: LegalPageType;
}

// ---------------------------------------------------------------------------
// Content Data
// ---------------------------------------------------------------------------

interface LegalSection {
  title: string;
  body: string;
}

const PAGE_TITLES: Record<LegalPageType, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  guidelines: "Community Guidelines",
};

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    body: "By downloading, accessing, or using the Vita application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the application. We reserve the right to update these terms at any time, and your continued use of Vita constitutes acceptance of any modifications.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years of age to create an account and use Vita. By registering, you represent and warrant that you are at least 18 years old, that all information you provide is accurate and truthful, and that you will maintain the accuracy of such information. We reserve the right to terminate accounts that violate these eligibility requirements.",
  },
  {
    title: "3. Your Account",
    body: "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Each person may maintain only one Vita account. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss or damage arising from your failure to protect your account information.",
  },
  {
    title: "4. User Conduct",
    body: "You agree not to use Vita for any unlawful purpose or in any way that could damage, disable, or impair the service. Prohibited conduct includes but is not limited to: harassment, bullying, or intimidation of other users; posting spam, fraudulent, or misleading content; creating fake profiles or impersonating others; soliciting personal information from other users for commercial purposes; and any activity that violates applicable local, state, national, or international law.",
  },
  {
    title: "5. Events & Check-ins",
    body: "Vita uses GPS-based verification to confirm attendance at events. By using the events and check-in features, you consent to location data being collected during the check-in process. You agree to provide accurate attendance information and not to manipulate or spoof your location data. Event organizers are responsible for ensuring their events comply with local regulations and safety requirements.",
  },
  {
    title: "6. Limitation of Liability",
    body: "Vita is provided on an \"as is\" and \"as available\" basis. To the fullest extent permitted by applicable law, Vita disclaims all warranties, express or implied. In no event shall Vita be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or goodwill, arising out of or in connection with your use of the application. Vita does not conduct background checks on users and is not responsible for the actions of any user.",
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, including your name, email address, phone number, date of birth, profile photos, bio, interests, and gender. We also collect location data when you use our map and event check-in features, device information such as your operating system and device type, and usage analytics including app interactions and feature engagement to improve our service.",
  },
  {
    title: "2. How We Use Your Data",
    body: "We use the information we collect to provide, maintain, and improve Vita's services. This includes matching you with compatible users, recommending events and groups based on your interests and location, verifying event attendance through GPS check-in, personalizing your experience, sending notifications about matches, messages, and events, and ensuring the safety and security of our platform and users.",
  },
  {
    title: "3. Data Sharing",
    body: "We do not sell your personal data to third parties. We may share limited information with service providers who help us operate our platform, such as cloud hosting providers, analytics services, and push notification services. We may also disclose information if required by law, to protect the rights and safety of our users, or in connection with a merger, acquisition, or sale of assets.",
  },
  {
    title: "4. Data Storage & Security",
    body: "Your data is stored securely using industry-standard encryption protocols. Our backend infrastructure is hosted on Supabase with PostgreSQL databases, which provides enterprise-grade security including encryption at rest and in transit. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.",
  },
  {
    title: "5. Your Rights",
    body: "You have the right to access, correct, or delete your personal data at any time. You can update your profile information directly within the app, request a copy of your data by contacting our support team, or delete your account and associated data through the Settings page. Upon account deletion, your data will be permanently removed from our systems within 30 days, except where retention is required by law.",
  },
  {
    title: "6. Contact Us",
    body: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at support@vitaapp.com. We will respond to your inquiry within a reasonable timeframe and work to address any concerns you may have about your data privacy.",
  },
];

const GUIDELINES_SECTIONS: LegalSection[] = [
  {
    title: "1. Be Authentic",
    body: "Vita is built on genuine connections. Use real, recent photos of yourself. Provide honest information in your profile, including your name, age, and interests. Do not impersonate other people or create misleading profiles. Authenticity is the foundation of meaningful connections, and profiles found to be deceptive may be removed without notice.",
  },
  {
    title: "2. Be Respectful",
    body: "Treat every member of the Vita community with dignity and respect. Hate speech, discrimination, racism, sexism, or any form of bigotry is strictly prohibited. Do not harass, stalk, bully, or intimidate other users. Respect boundaries when someone declines an invitation or stops responding. Disagreements should be handled constructively and never through personal attacks.",
  },
  {
    title: "3. Stay Safe",
    body: "Your safety is our top priority. When meeting someone for the first time, always choose a public location. Share your plans with a friend or family member, including where you are going and who you are meeting. Trust your instincts and leave any situation that makes you uncomfortable. Never share sensitive personal information such as your home address, financial details, or social security number with people you have just met on the platform.",
  },
  {
    title: "4. Content Standards",
    body: "All content shared on Vita must be appropriate for a general audience. Explicit, sexually suggestive, or pornographic content is not allowed. Do not post violent, graphic, or disturbing images or text. Copyrighted material should not be shared without proper authorization. Commercial advertising, promotional content, and solicitation are prohibited unless specifically approved by Vita.",
  },
  {
    title: "5. Events & Groups",
    body: "Honor your RSVPs. If you commit to attending an event, make every effort to show up. Repeated no-shows may affect your group health ring status. Participate genuinely in groups and events, contributing positively to the community. Event organizers should provide accurate descriptions and ensure a welcoming environment for all attendees. Do not use events or groups for unauthorized commercial purposes.",
  },
  {
    title: "6. Consequences",
    body: "Violations of these Community Guidelines may result in escalating consequences. First-time minor violations may result in a warning. Repeated violations or more serious offenses may lead to temporary suspension of your account. Severe violations, including any form of abuse, harassment, or illegal activity, may result in permanent banning from the platform. We reserve the right to take action at our discretion to maintain a safe and welcoming community for all users.",
  },
];

const CONTENT_MAP: Record<LegalPageType, LegalSection[]> = {
  terms: TERMS_SECTIONS,
  privacy: PRIVACY_SECTIONS,
  guidelines: GUIDELINES_SECTIONS,
};

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------

function TableOfContents({ sections }: { sections: LegalSection[] }) {
  return (
    <View style={s.tocCard}>
      <View style={s.tocAccent} />
      <Text style={s.tocTitle}>Contents</Text>
      {sections.map((section, index) => (
        <View key={section.title} style={s.tocItem}>
          <View style={s.tocBullet} />
          <Text style={s.tocItemText}>{section.title}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LegalPage({ onClose, type }: LegalPageProps) {
  const insets = useSafeAreaInsets();
  const sections = CONTENT_MAP[type];
  const title = PAGE_TITLES[type];

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
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color="#111827" />
            </Pressable>
            <Text style={s.headerTitle}>{title}</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={[
              s.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Last updated */}
            <Text style={s.lastUpdated}>Last updated: February 2026</Text>

            {/* Table of Contents */}
            <TableOfContents sections={sections} />

            {/* Sections */}
            {sections.map((section) => (
              <View key={section.title} style={s.sectionCard}>
                <View style={s.sectionAccent} />
                <View style={s.sectionInner}>
                  <Text style={s.sectionTitle}>{section.title}</Text>
                  <Text style={s.sectionBody}>{section.body}</Text>
                </View>
              </View>
            ))}

            {/* Footer */}
            <Text style={s.footer}>
              Questions? Contact support@vitaapp.com
            </Text>
          </ScrollView>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

LegalPage.displayName = "LegalPage";

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
    paddingTop: 16,
  },

  // Last updated
  lastUpdated: {
    fontSize: 12,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    paddingLeft: 4,
  },

  // Table of Contents
  tocCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tocAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  tocTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A0AEC0",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  tocItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 5,
  },
  tocBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.secondary,
  },
  tocItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.primary,
    fontFamily: "Inter_500Medium",
  },

  // Section cards
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    backgroundColor: COLORS.secondary,
  },
  sectionInner: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2D3D",
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    fontWeight: "400",
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },

  // Footer
  footer: {
    fontSize: 13,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 28,
    marginBottom: 40,
  },
});
