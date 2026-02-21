import React, { type ReactNode } from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import { cn } from "@/lib/utils";

/* ─── Variant Map ─── */

const variantClasses = {
  elevated: "bg-white rounded-2xl",
  flat: "bg-gray-50 rounded-2xl",
  outlined: "bg-white border border-gray-200 rounded-2xl",
} as const;

export type CardVariant = keyof typeof variantClasses;

/* ─── Shadow for elevated variant ─── */

const elevatedShadow: ViewStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 2,
};

/* ─── Card ─── */

export interface CardProps {
  /** Visual style variant */
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  variant = "elevated",
  children,
  className,
  style,
}: CardProps) {
  return (
    <View
      className={cn(variantClasses[variant], "overflow-hidden", className)}
      style={[variant === "elevated" ? elevatedShadow : undefined, style]}
    >
      {children}
    </View>
  );
}

Card.displayName = "Card";

/* ─── CardHeader ─── */

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <View className={cn("px-5 pt-5 pb-3", className)}>{children}</View>;
}

CardHeader.displayName = "CardHeader";

/* ─── CardContent ─── */

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn("px-5 py-3", className)}>{children}</View>;
}

CardContent.displayName = "CardContent";

/* ─── CardFooter ─── */

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn("px-5 pt-3 pb-5 flex-row items-center gap-2", className)}>
      {children}
    </View>
  );
}

CardFooter.displayName = "CardFooter";
