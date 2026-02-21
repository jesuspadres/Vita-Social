import React, { Component, type ReactNode } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { AlertCircle, RefreshCw } from "lucide-react-native";

/* ─── Types ─── */

interface ErrorBoundaryProps {
  /** Content to render when no error has occurred */
  children: ReactNode;
  /** Optional fallback UI to render instead of the default error screen */
  fallback?: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ─── Default Error Fallback ─── */

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDev = __DEV__;

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      {/* Icon */}
      <View
        className="mb-6 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(229, 62, 62, 0.1)" }}
      >
        <AlertCircle size={32} color="#E53E3E" />
      </View>

      {/* Heading */}
      <Text
        className="mb-2 text-xl font-bold text-center"
        style={{ color: "#1A365D" }}
      >
        Something went wrong
      </Text>

      {/* Description */}
      <Text className="mb-6 text-sm text-gray-500 text-center max-w-[300px]">
        An unexpected error occurred. Please try again, and if the problem
        persists, contact support.
      </Text>

      {/* Retry Button */}
      <Pressable
        onPress={resetError}
        className="mb-4 flex-row items-center gap-2 rounded-xl px-6 py-3 active:opacity-80"
        style={{
          backgroundColor: "#1A365D",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <RefreshCw size={16} color="#ffffff" />
        <Text className="text-sm font-medium text-white">Try Again</Text>
      </Pressable>

      {/* Error details in DEV mode */}
      {isDev && (
        <ScrollView
          className="mt-4 w-full max-w-[340px] max-h-48 rounded-lg p-4"
          style={{
            backgroundColor: "rgba(229, 62, 62, 0.05)",
            borderWidth: 1,
            borderColor: "rgba(229, 62, 62, 0.2)",
          }}
        >
          <Text className="text-xs font-semibold text-[#E53E3E] mb-1">
            {error.name}: {error.message}
          </Text>
          {error.stack && (
            <Text className="text-[10px] leading-relaxed text-gray-500">
              {error.stack}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Error Boundary Class Component ─── */

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);

    if (__DEV__) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary, ErrorFallback };
export type { ErrorBoundaryProps, ErrorFallbackProps };
