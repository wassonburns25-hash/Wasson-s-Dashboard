import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeBarChart } from "@/components/charts/bar-chart";
import { ManualEntry } from "./manual-entry";
import { MoneyDashboard } from "../money/money-dashboard";
import type { DailyLog, WorkLog } from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  startOfWeek,
  weekLabel,
} from "@/lib/utils";
import { Wallet, CalendarRange, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type Entry = {
  date: string;
  amount: number;
  source: "Work" | "Manual";
  note: string | null;
};

export default async function FinancePage() {
  const supabase = createClient();

  const [{ data: workLogsData }, { data: dailyData }, { data: accountsData }] =
    await Promise.all([
      supabase
        .from("work_logs")
        .select("*")
        .order("work_date", { ascending: false }),
      supabase
        .from("daily_logs")
        .select("*")
        .gt("earnings", 0)
        .order("log_date", { ascending: false }),
      supabase.from("money_accounts").select("key, balance"),
    ]);

  const workLogs = (workLogsData ?? []) as WorkLog[];
  const dailyLogs = (dailyData ?? []) as DailyLog[];

  const initialBalances: Record<string, number> = {};
  for (const row of accountsData ?? []) {
    initialBalances[(row as { key: string }).key] = Number(
      (row as { balance: number }).balance
    );
  }

  const entries: Entry[] = [
    ...workLogs.map((l) => ({
      date: l.work_date,
      amount: Number(l.earnings),
      source: "Work" as const,
      note: l.note,
    })),
    ...dailyLogs.map((d) => ({
      date: d.log_date,
      amount: Number(d.earnings),
      source: "Manual" as const,
      note: null,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  // Weekly totals for the chart (last 8 weeks with data).
  const weekMap = new Map<string, { date: Date; total: number }>();
  for (const e of entries) {
    const start = startOfWeek(new Date(e.date));
    const key = start.toISOString().slice(0, 10);
    const existing = weekMap.get(key);
    if (existing) existing.total += e.amount;
    else weekMap.set(key, { date: start, total: e.amount });
  }
  const weekly = [...weekMap.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-8)
    .map((e) => ({ label: weekLabel(e.date), total: Math.round(e.total) }));

  // Totals.
  const now = new Date();
  const thisWeekStart = startOfWeek(now).toISOString().slice(0, 10);
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const weekTotal = entries
    .filter((e) => e.date >= thisWeekStart)
    .reduce((s, e) => s + e.amount, 0);
  const monthTotal = entries
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((s, e) => s + e.amount, 0);
  const allTime = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Finances"
        description="Net worth and accounts, plus income from work and earnings."
      />

      <Tabs defaultValue="money">
        <TabsList className="mb-6">
          <TabsTrigger value="money">Money</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value="money">
          <MoneyDashboard initial={initialBalances} />
        </TabsContent>

        <TabsContent value="income">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="This week" value={formatCurrency(weekTotal)} icon={Wallet} />
        <StatCard
          label="This month"
          value={formatCurrency(monthTotal)}
          icon={CalendarRange}
        />
        <StatCard label="All time" value={formatCurrency(allTime)} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly income</CardTitle>
            <CardDescription>Combined work + manual entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeBarChart
              data={weekly}
              emptyText="Log work or add earnings to see income by week."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add daily earnings</CardTitle>
            <CardDescription>
              Manual entry for cash or one-off income.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManualEntry />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Earnings log</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No income recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 60).map((e, i) => (
                  <TableRow key={`${e.date}-${e.source}-${i}`}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(e.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={e.source === "Work" ? "default" : "secondary"}
                      >
                        {e.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.note}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(e.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
