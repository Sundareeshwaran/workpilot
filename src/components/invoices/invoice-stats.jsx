"use client";

import React from "react";
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function InvoiceStats({ stats = {}, loading = false }) {
  const cards = [
    {
      title: "Total Invoiced",
      value: formatCurrency(stats.totalInvoiced || 0),
      subtitle: `${stats.totalInvoices || 0} total invoices`,
      icon: IndianRupee,
      iconClass: "bg-primary/10 text-primary",
      ringClass: "ring-primary/10",
    },
    {
      title: "Paid Revenue",
      value: formatCurrency(stats.totalPaid || 0),
      subtitle: "Successfully received",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      ringClass: "ring-emerald-500/10",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(stats.totalPending || 0),
      subtitle: `${stats.draftCount || 0} drafts pending`,
      icon: Clock,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      ringClass: "ring-sky-500/10",
    },
    {
      title: "Overdue Attention",
      value: `${stats.overdueCount || 0}`,
      subtitle: stats.overdueCount > 0 ? "Invoices past due date" : "All payments on track",
      icon: AlertTriangle,
      iconClass:
        (stats.overdueCount || 0) > 0
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          : "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      ringClass:
        (stats.overdueCount || 0) > 0
          ? "ring-rose-500/10"
          : "ring-slate-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-xs border bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="shadow-xs border bg-card/80 backdrop-blur-xs hover:border-primary/30 transition-all"
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </h3>
                <p className="text-[11px] text-muted-foreground/80">
                  {card.subtitle}
                </p>
              </div>

              <div
                className={`size-11 rounded-xl flex items-center justify-center shrink-0 ring-4 ${card.iconClass} ${card.ringClass}`}
              >
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
