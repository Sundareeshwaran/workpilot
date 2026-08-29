"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ),
        info: <InfoIcon className="size-4 text-primary shrink-0" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-destructive shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:p-4 group-[.toaster]:font-sans group-[.toaster]:border",
          title:
            "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:text-foreground",
          description:
            "group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:mt-1 leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:text-xs",
          closeButton:
            "group-[.toast]:bg-card group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground group-[.toast]:border-border",
          error:
            "group-[.toaster]:border-destructive/40 group-[.toaster]:bg-card dark:group-[.toaster]:border-destructive/50",
          success:
            "group-[.toaster]:border-emerald-500/40 group-[.toaster]:bg-card dark:group-[.toaster]:border-emerald-500/50",
          warning:
            "group-[.toaster]:border-amber-500/40 group-[.toaster]:bg-card dark:group-[.toaster]:border-amber-500/50",
          info:
            "group-[.toaster]:border-primary/40 group-[.toaster]:bg-card dark:group-[.toaster]:border-primary/50",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
