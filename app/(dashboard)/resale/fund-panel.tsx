"use client";

import { useState, useTransition } from "react";
import {
  updateFundSettings,
  addFundContribution,
  deleteFundContribution,
} from "./actions";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FundContribution, FundSettings } from "@/lib/types";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Plus,
  Trash2,
  Settings2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export function FundPanel({
  settings,
  contributions,
  netInvested,
}: {
  settings: FundSettings;
  contributions: FundContribution[];
  netInvested: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showSettings, setShowSettings] = useState(false);

  // Add-contribution form
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(todayISO());

  // Settings form
  const [fundName, setFundName] = useState(settings.fund_name);
  const [currentValue, setCurrentValue] = useState(
    String(settings.current_value || "")
  );
  const [allocation, setAllocation] = useState(String(settings.allocation_pct));

  const gain = Number(settings.current_value) - netInvested;
  const gainPct = netInvested > 0 ? (gain / netInvested) * 100 : 0;

  function addContribution(kind: "contribution" | "withdrawal") {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Enter an amount");
      return;
    }
    startTransition(async () => {
      try {
        await addFundContribution({
          amount: value,
          kind,
          source: "manual",
          note: note || null,
          occurred_on: when,
        });
        toast.success(kind === "contribution" ? "Added to fund" : "Withdrawal recorded");
        setAmount("");
        setNote("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function saveSettings() {
    startTransition(async () => {
      try {
        await updateFundSettings({
          fund_name: fundName,
          current_value: Number(currentValue) || 0,
          allocation_pct: Number(allocation) || 0,
        });
        toast.success("Fund settings saved");
        setShowSettings(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Remove this entry?")) return;
    startTransition(async () => {
      try {
        await deleteFundContribution(id);
        toast.success("Removed");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{settings.fund_name}</h2>
          <p className="text-sm text-muted-foreground">
            Route a slice of every sale into your investments and watch it grow.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSettings((s) => !s)}
        >
          <Settings2 className="h-4 w-4" /> Settings
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Net invested"
          value={formatCurrency(netInvested)}
          icon={PiggyBank}
          hint="Contributions minus withdrawals"
        />
        <StatCard
          label="Current value"
          value={formatCurrency(Number(settings.current_value))}
          icon={Wallet}
          hint="You update this from your brokerage"
        />
        <StatCard
          label="Gain / loss"
          value={`${gain >= 0 ? "+" : ""}${formatCurrency(gain)}`}
          icon={gain >= 0 ? TrendingUp : TrendingDown}
          hint={netInvested > 0 ? `${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : "Add value to track"}
        />
      </div>

      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fund settings</CardTitle>
            <CardDescription>
              Name your fund, update its current market value, and set how much of
              each sale to invest by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fs-name">Fund name</Label>
                <Input
                  id="fs-name"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fs-value">Current value ($)</Label>
                <Input
                  id="fs-value"
                  type="number"
                  inputMode="decimal"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fs-alloc">
                Invest {allocation}% of each sale by default
              </Label>
              <Input
                id="fs-alloc"
                type="range"
                min="0"
                max="100"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
              />
            </div>
            <Button onClick={saveSettings} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Move money</CardTitle>
          <CardDescription>
            Add cash to the fund or record a withdrawal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="fc-amount">Amount ($)</Label>
              <Input
                id="fc-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="sm:w-32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fc-date">Date</Label>
              <Input
                id="fc-date"
                type="date"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="sm:w-auto"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="fc-note">Note</Label>
              <Input
                id="fc-note"
                placeholder="optional"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addContribution("contribution")}
                disabled={isPending}
              >
                <Plus className="h-4 w-4" /> Invest
              </Button>
              <Button
                variant="secondary"
                onClick={() => addContribution("withdrawal")}
                disabled={isPending}
              >
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fund activity</CardTitle>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No contributions yet. Sell an item and invest the proceeds, or add
              cash above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((c) => {
                  const withdrawal = c.kind === "withdrawal";
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(c.occurred_on)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.source === "sale" ? "default" : "secondary"}>
                          {c.source === "sale" ? "Sale" : "Manual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.note}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          withdrawal ? "text-destructive" : ""
                        }`}
                      >
                        {withdrawal ? "−" : "+"}
                        {formatCurrency(Number(c.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={isPending}
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
