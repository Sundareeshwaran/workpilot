"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Receipt,
  MoreVertical,
  Edit2,
  Trash2,
  Plus,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";
import PaymentMethodBadge from "./payment-method-badge";
import PaymentFormDialog from "./payment-form-dialog";
import DeletePaymentDialog from "./delete-payment-dialog";

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

export default function PaymentHistoryTable({
  payments = [],
  invoice,
  onPaymentUpdated,
  onPaymentDeleted,
  onAddPaymentClick,
}) {
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState(null);
  const [selectedPaymentForDelete, setSelectedPaymentForDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEditClick = (payment) => {
    setSelectedPaymentForEdit(payment);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (payment) => {
    setSelectedPaymentForDelete(payment);
    setDeleteDialogOpen(true);
  };

  const remainingBalance = Math.max(
    0,
    Number(
      (
        Number(invoice?.total || 0) -
        payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      ).toFixed(2)
    )
  );

  return (
    <div className="space-y-4">
      {/* Table Content */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Payment & Settlement History
              </h3>
              <p className="text-xs text-muted-foreground">
                {payments.length} transaction{payments.length === 1 ? "" : "s"} recorded for this invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {remainingBalance > 0 && onAddPaymentClick && (
              <Button
                size="sm"
                onClick={onAddPaymentClick}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs font-semibold"
              >
                <Plus className="size-3.5" />
                <span>Record Payment</span>
              </Button>
            )}
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[120px] text-xs font-semibold">
                    Payment Date
                  </TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold">
                    Method
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Reference / Transaction ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Notes & Remarks
                  </TableHead>
                  <TableHead className="w-[160px] text-right text-xs font-semibold">
                    Amount Paid
                  </TableHead>
                  <TableHead className="w-[50px] text-center text-xs font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, idx) => (
                  <TableRow
                    key={payment.id || idx}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {/* Date */}
                    <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                      {formatDate(payment.paymentDate)}
                    </TableCell>

                    {/* Method */}
                    <TableCell className="text-xs">
                      <PaymentMethodBadge method={payment.paymentMethod} />
                    </TableCell>

                    {/* Reference ID */}
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {payment.referenceNumber ? (
                        <span className="text-foreground font-semibold">
                          {payment.referenceNumber}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/60">—</span>
                      )}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {payment.notes || <span className="italic text-muted-foreground/60">—</span>}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatCurrency(payment.amount)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 cursor-pointer hover:bg-muted"
                          >
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 text-xs">
                          <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                            Payment Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditClick(payment)}
                            className="gap-2 cursor-pointer text-xs"
                          >
                            <Edit2 className="size-3.5 text-muted-foreground" />
                            <span>Edit Payment</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(payment)}
                            className="gap-2 cursor-pointer text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Delete Payment</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="size-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <Receipt className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No Payments Recorded Yet
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No transactions have been logged for this invoice. Record incoming client payments to track settlements.
              </p>
            </div>
            {remainingBalance > 0 && onAddPaymentClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddPaymentClick}
                className="gap-1.5 text-xs cursor-pointer font-medium"
              >
                <Plus className="size-3.5 text-primary" />
                <span>Record First Payment</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Payment Dialog */}
      {selectedPaymentForEdit && (
        <PaymentFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          invoice={invoice}
          paymentToEdit={selectedPaymentForEdit}
          onSuccess={(updated) => {
            if (onPaymentUpdated) onPaymentUpdated(updated);
            setSelectedPaymentForEdit(null);
          }}
        />
      )}

      {/* Delete Payment Dialog */}
      {selectedPaymentForDelete && (
        <DeletePaymentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          payment={selectedPaymentForDelete}
          invoiceNumber={invoice?.invoiceNumber}
          onSuccess={(res) => {
            if (onPaymentDeleted) onPaymentDeleted(res);
            setSelectedPaymentForDelete(null);
          }}
        />
      )}
    </div>
  );
}
