import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Heart,
  ShieldCheck,
  MapPin,
  Users,
  MoreHorizontal,
} from "lucide-react-native";
import { getAge, type DiscoverUser } from "@/lib/mock-data";
import { TrustThermometer } from "@/components/ui/trust-thermometer";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_WIDTH = SCREEN_WIDTH;
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.1;

const CHIP_COLORS = ["#4A90A4", "#38A169", "#D69E2E", "#3182CE", "#E53E3E"];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProfileCardProps {
  user: DiscoverUser;
  onClose: () => void;
  onLike: () => void;
  onPass: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileCard({ user, onClose, onLike, onPass }: ProfileCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const photos = user.photos.length > 0 ? user.photos : [user.avatar_url ?? ""];
  const age = getAge(user.birthdate);

  const handleReportMenu = () => {
    Alert.alert(
      user.first_name,
      "What would you like to do?",
      [
        {
          text: "Report Profile",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Report Submitted",
              "Thank you for helping keep Vita safe. We'll review this profile.",
              [{ text: "OK" }],
            );
          },
        },
        {
          text: "Not Interested",
          onPress: () => {
            onPass();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Photo Gallery */}
          <View style={styles.galleryWrapper}>
            <FlatList
              ref={flatListRef}
              data={photos}
              keyExtractor={(_, i) => `photo-${i}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActivePhotoIndex(newIndex);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              )}
            />

            {/* Close Button */}
            <Pressable style={[styles.closeBtn, { top: Math.max(insets.top, 12) }]} onPress={onClose}>
              <X size={22} color="#FFFFFF" />
            </Pressable>

            {/* Report / More Button */}
            <Pressable
              style={[styles.moreBtn, { top: Math.max(insets.top, 12) }]}
              onPress={handleReportMenu}
              hitSlop={8}
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <MoreHorizontal size={20} color="#FFFFFF" />
            </Pressable>

            {/* Dot Indicators */}
            {photos.length > 1 && (
              <View style={styles.dots}>
                {photos.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === activePhotoIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.infoSection}>
            {/* Name, Age, Verification */}
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {user.first_name}, {age}
              </Text>
              {user.verification_level !== "none" && (
                <ShieldCheck size={20} color="#3182CE" style={{ marginLeft: 6 }} />
              )}
            </View>

            {/* Distance */}
            <View style={styles.metaRow}>
              <MapPin size={14} color="#A0AEC0" />
              <Text style={styles.metaText}>{user.distance}</Text>
            </View>

            {/* Trust Thermometer */}
            <View style={styles.trustRow}>
              <TrustThermometer
                levels={{
                  phone: true,
                  photo: user.verification_level === "photo" || user.verification_level === "id",
                  id: user.verification_level === "id",
                  eventsAttended: user.eventsAttended ?? 0,
                }}
              />
            </View>

            {/* About */}
            {user.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{user.bio}</Text>
              </View>
            )}

            {/* Interests */}
            {user.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.chipContainer}>
                  {user.interests.map((interest, i) => (
                    <View
                      key={interest}
                      style={[
                        styles.chip,
                        { backgroundColor: `${CHIP_COLORS[i % CHIP_COLORS.length]}18` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: CHIP_COLORS[i % CHIP_COLORS.length] },
                        ]}
                      >
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Groups */}
            {user.groups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Groups</Text>
                {user.groups.map((group) => (
                  <View key={group} style={styles.groupRow}>
                    <View style={styles.groupIcon}>
                      <Users size={16} color="#4A90A4" />
                    </View>
                    <Text style={styles.groupName}>{group}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Spacer for bottom bar */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Fixed Bottom Bar */}
        <View style={styles.bottomBar}>
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
            style={styles.bottomGradient}
          />
          <View style={styles.bottomActions}>
            {/* Pass */}
            <Pressable style={styles.bottomPassBtn} onPress={onPass}>
              <X size={26} color="#A0AEC0" />
              <Text style={styles.bottomPassText}>Pass</Text>
            </Pressable>

            {/* Like */}
            <Pressable style={styles.bottomLikeBtn} onPress={onLike}>
              <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.bottomLikeText}>Like</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  // Photo gallery
  galleryWrapper: {
    position: "relative",
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  moreBtn: {
    position: "absolute",
    right: 64,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  // Info
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A365D",
    fontFamily: "Inter_700Bold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
  trustRow: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A365D",
    marginBottom: 10,
    fontFamily: "Inter_600SemiBold",
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4A5568",
    fontFamily: "Inter_400Regular",
  },
  // Interest chips
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Groups
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(74,144,164,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2D3748",
    fontFamily: "Inter_500Medium",
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomGradient: {
    height: 32,
  },
  bottomActions: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 12,
  },
  bottomPassBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    minHeight: 48,
  },
  bottomPassText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A0AEC0",
    fontFamily: "Inter_600SemiBold",
  },
  bottomLikeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#38A169",
    gap: 8,
    minHeight: 48,
    shadowColor: "#38A169",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomLikeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
});

ProfileCard.displayName = "ProfileCard";
