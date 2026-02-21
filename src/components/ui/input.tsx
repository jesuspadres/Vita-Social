import React, { forwardRef, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

export interface InputProps extends TextInputProps {
  /** Label displayed above the input */
  label?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error message -- when present the input shows a danger border */
  error?: string;
  /** Icon or element rendered inside the left of the input */
  iconLeft?: ReactNode;
  /** Icon or element rendered inside the right of the input */
  iconRight?: ReactNode;
  /** Additional className for the outer container */
  containerClassName?: string;
}

/* ─── Border Styles ─── */

const baseBorder: ViewStyle = {
  borderWidth: 1,
  borderColor: "#D1D5DB", // gray-300
};

const errorBorder: ViewStyle = {
  borderWidth: 1,
  borderColor: "#E53E3E", // danger
};

/* ─── Component ─── */

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      error,
      iconLeft,
      iconRight,
      editable = true,
      containerClassName,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(error);
    const isDisabled = editable === false;

    return (
      <View className={cn("gap-1.5", containerClassName)}>
        {/* Label */}
        {label && (
          <Text className="text-sm font-medium text-gray-800">{label}</Text>
        )}

        {/* Input wrapper */}
        <View
          className={cn(
            "flex-row items-center rounded-xl bg-white",
            isDisabled && "opacity-50",
          )}
          style={hasError ? errorBorder : baseBorder}
        >
          {/* Left icon */}
          {iconLeft && (
            <View className="pl-3">
              {iconLeft}
            </View>
          )}

          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor="#9CA3AF"
            className={cn(
              "flex-1 px-4 py-3 text-sm text-gray-900",
              iconLeft && "pl-2",
              iconRight && "pr-2",
              className,
            )}
            style={[{ minHeight: 48 }, style]}
            {...props}
          />

          {/* Right icon */}
          {iconRight && (
            <View className="pr-3">
              {iconRight}
            </View>
          )}
        </View>

        {/* Error message */}
        {hasError && (
          <Text className="text-xs text-[#E53E3E]">{error}</Text>
        )}

        {/* Helper text (only if no error) */}
        {!hasError && helperText && (
          <Text className="text-xs text-gray-500">{helperText}</Text>
        )}
      </View>
    );
  },
);

Input.displayName = "Input";
