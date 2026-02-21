import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, CheckCheck } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageBubbleProps {
  /** Message text content */
  content: string;
  /** ISO timestamp */
  timestamp: string;
  /** Whether this message was sent by the current user */
  isSent: boolean;
  /** Whether the recipient has read this message */
  isRead: boolean;
  /** Whether to show the timestamp below */
  showTimestamp: boolean;
  /** Whether this is the last message in a cluster from the same sender */
  isLastInCluster: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageBubble({
  content,
  timestamp,
  isSent,
  isRead,
  showTimestamp,
  isLastInCluster,
}: MessageBubbleProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[
        styles.wrapper,
        isSent ? styles.wrapperSent : styles.wrapperReceived,
        !isLastInCluster && styles.clusterSpacing,
      ]}
      accessible={true}
      accessibilityLabel={`${isSent ? "You" : "Them"}: ${content}, ${formatTime(timestamp)}`}
    >
      {/* Bubble */}
      {isSent ? (
        <LinearGradient
          colors={["#1A365D", "#4A90A4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bubble,
            styles.bubbleSent,
            !isLastInCluster && styles.bubbleSentCluster,
          ]}
        >
          <Text style={styles.textSent}>{content}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.bubbleReceived,
            !isLastInCluster && styles.bubbleReceivedCluster,
          ]}
        >
          <Text style={styles.textReceived}>{content}</Text>
        </View>
      )}

      {/* Timestamp + Read Receipt */}
      {showTimestamp && (
        <View
          style={[
            styles.metaRow,
            isSent ? styles.metaRowSent : styles.metaRowReceived,
          ]}
        >
          <Text style={styles.metaText}>{formatTime(timestamp)}</Text>
          {isSent && (
            isRead ? (
              <CheckCheck size={12} color="#4A90A4" />
            ) : (
              <Check size={12} color="#A0AEC0" />
            )
          )}
        </View>
      )}
    </Animated.View>
  );
}

MessageBubble.displayName = "MessageBubble";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: "80%",
    marginVertical: 2,
  },
  wrapperSent: {
    alignSelf: "flex-end",
    marginLeft: "20%",
  },
  wrapperReceived: {
    alignSelf: "flex-start",
    marginRight: "20%",
  },
  clusterSpacing: {
    marginVertical: 1,
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
  },
  bubbleSent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
  },
  bubbleSentCluster: {
    borderBottomRightRadius: 18,
  },
  bubbleReceived: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 18,
  },
  bubbleReceivedCluster: {
    borderBottomLeftRadius: 18,
  },

  textSent: {
    fontSize: 15,
    lineHeight: 22,
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
  },
  textReceived: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1F2937",
    fontFamily: "Inter_400Regular",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 4,
  },
  metaRowSent: {
    justifyContent: "flex-end",
  },
  metaRowReceived: {
    justifyContent: "flex-start",
  },
  metaText: {
    fontSize: 11,
    color: "#A0AEC0",
    fontFamily: "Inter_400Regular",
  },
});
