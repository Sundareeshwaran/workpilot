"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Building,
  CreditCard,
  Banknote,
  Globe,
  HelpCircle,
} from "lucide-react";

export const PAYMENT_METHOD_CONFIG = {
  UPI: {
    label: "UPI",
    icon: Smartphone,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    icon: Building,
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  },
  CARD: {
    label: "Card",
    icon: CreditCard,
    className:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
  CASH: {
    label: "Cash",
    icon: Banknote,
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  PAYPAL: {
    label: "PayPal",
    icon: Globe,
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  OTHER: {
    label: "Other",
    icon: HelpCircle,
    className:
      "bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800",
  },
};

export default function PaymentMethodBadge({ method = "UPI", className = "" }) {
  const normalizedMethod = (method || "OTHER").toUpperCase();
  const config = PAYMENT_METHOD_CONFIG[normalizedMethod] || PAYMENT_METHOD_CONFIG.OTHER;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium transition-colors shadow-2xs",
        config.className,
        className
      )}
    >
      <Icon className="size-3 shrink-0" />
      <span>{config.label}</span>
    </Badge>
  );
}
