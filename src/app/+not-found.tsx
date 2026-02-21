import { View, Text, StyleSheet } from "react-native";
import { Link, Stack } from "expo-router";
import { Compass } from "lucide-react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Compass size={32} color="#FFFFFF" />
        </View>

        <Text style={styles.badge}>404</Text>
        <Text style={styles.heading}>Screen not found</Text>
        <Text style={styles.description}>
          The screen you are looking for does not exist or has been moved.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#1A365D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  badge: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    color: "#3A7487",
    backgroundColor: "rgba(74, 144, 164, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  heading: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#1A365D",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#718096",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 280,
  },
  link: {
    backgroundColor: "#1A365D",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
