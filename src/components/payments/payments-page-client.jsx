"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import PaymentMethodBadge from "./payment-method-badge";
import { PAYMENT_METHOD_VALUES, PAYMENT_METHOD_LABELS } from "@/validations/payment.validation";

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(val = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(val);
}

export default function PaymentsPageClient({ initialData }) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialData?.payments || []);
  const [stats, setStats] = useState(initialData?.stats || { totalCollected: 0, totalCount: 0, methodBreakdown: {} });
  const [pagination, setPagination] = useState(initialData?.pagination || { page: 1, limit: 10, totalPages: 1, totalPayments: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [sortBy, setSortBy] = useState("paymentDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      if (search.trim()) params.set("search", search.trim());
      if (selectedMethod && selectedMethod !== "ALL") params.set("paymentMethod", selectedMethod);

      const res = await fetch(`/api/payments?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setPayments(data.payments || []);
        setStats(data.stats || { totalCollected: 0, totalCount: 0, methodBreakdown: {} });
        setPagination(data.pagination || { page: 1, limit: 10, totalPages: 1, totalPayments: 0 });
      }
    } catch (err) {
      console.error("FETCH PAYMENTS ERROR:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, selectedMethod, sortBy, sortOrder]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="size-3.5" />
              <span>Settlement Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Payments & Settlements
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Track, inspect, and reconcile client invoice payments, transactions, payment methods, and historical receipts.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(true)}
            disabled={refreshing || loading}
            className="gap-2 cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collected */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Revenue Collected</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(stats.totalCollected)}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Transactions Logged</p>
              <p className="text-2xl font-extrabold text-foreground font-mono">
                {stats.totalCount}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Top Payment Channel */}
        <Card className="shadow-2xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Active Methods</p>
              <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                {Object.keys(stats.methodBreakdown || {}).length > 0 ? (
                  Object.entries(stats.methodBreakdown).map(([method, amt]) => (
                    <Badge key={method} variant="secondary" className="text-[10px] px-2 py-0.5">
                      {method}: {formatCurrency(amt)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No payments recorded</span>
                )}
              </div>
            </div>
            <div className="size-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <CreditCard className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-2xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference number, invoice number, client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <Select
              value={selectedMethod}
              onValueChange={(val) => {
                setSelectedMethod(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] text-xs">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payment Methods</SelectItem>
                {PAYMENT_METHOD_VALUES.map((method) => (
                  <SelectItem key={method} value={method} className="text-xs">
                    {PAYMENT_METHOD_LABELS[method] || method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(val) => {
                const [field, order] = val.split("-");
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[170px] text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paymentDate-desc">Newest First</SelectItem>
                <SelectItem value="paymentDate-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" size="sm" className="cursor-pointer text-xs font-semibold">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold">Transaction Records</CardTitle>
            <CardDescription className="text-xs">
              Showing {payments.length} of {pagination.totalPayments} total payment transactions
            </CardDescription>
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[120px] text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Invoice</TableHead>
                  <TableHead className="text-xs font-semibold">Client</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold">Method</TableHead>
                  <TableHead className="text-xs font-semibold">Reference ID</TableHead>
                  <TableHead className="text-xs font-semibold">Notes</TableHead>
                  <TableHead className="w-[160px] text-right text-xs font-semibold pr-6">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                    {/* Date */}
                    <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </TableCell>

                    {/* Invoice */}
                    <TableCell className="text-xs">
                      {p.invoice ? (
                        <Link
                          href={`/invoices/${p.invoice.id}`}
                          className="font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>#{p.invoice.invoiceNumber}</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Client */}
                    <TableCell className="text-xs">
                      {p.invoice?.client ? (
                        <Link
                          href={`/clients/${p.invoice.client.id}`}
                          className="text-foreground hover:text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <span>{p.invoice.client.name}</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Method */}
                    <TableCell className="text-xs">
                      <PaymentMethodBadge method={p.paymentMethod} />
                    </TableCell>

                    {/* Reference ID */}
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {p.referenceNumber || <span className="italic text-muted-foreground/60">—</span>}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {p.notes || <span className="italic text-muted-foreground/60">—</span>}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono pr-6">
                      +{formatCurrency(p.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <Receipt className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">No Payments Found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No payment records matched your search filters. Try adjusting your query or record a payment directly on an invoice.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link href="/invoices">
                <span>Go to Invoices</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={!pagination.hasPreviousPage || loading}
                className="gap-1 text-xs h-8 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pagination.hasNextPage || loading}
                className="gap-1 text-xs h-8 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
