import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
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
import { IncomeBarChart } from "@/components/charts/bar-chart";
import { AssignmentForm } from "./assignment-form";
import { WorkLogForm } from "./worklog-form";
import { AssignmentStatusSelect } from "./assignment-status-select";
import { ReadingList, type Book } from "./reading-list";
import { DeleteButton } from "@/components/delete-button";
import { deleteAssignment, deleteWorkLog } from "./actions";
import type { Assignment, WorkLog } from "@/lib/types";
import { formatCurrency, formatDate, monthLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const priorityVariant = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
} as const;

function computeMonthlyEarnings(logs: WorkLog[]) {
  const map = new Map<string, { date: Date; total: number }>();
  for (const l of logs) {
    const d = new Date(l.work_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const existing = map.get(key);
    const amt = Number(l.earnings);
    if (existing) existing.total += amt;
    else map.set(key, { date: new Date(d.getFullYear(), d.getMonth(), 1), total: amt });
  }
  return [...map.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((e) => ({ label: monthLabel(e.date), total: Math.round(e.total) }));
}

export default async function AcademicsPage() {
  const supabase = createClient();

  const [{ data: assignmentsData }, { data: workLogsData }, { data: booksData }] =
    await Promise.all([
      supabase
        .from("assignments")
        .select("*")
        .order("due_date", { ascending: true }),
      supabase
        .from("work_logs")
        .select("*")
        .order("work_date", { ascending: false })
        .limit(200),
      supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const assignments = (assignmentsData ?? []) as Assignment[];
  const workLogs = (workLogsData ?? []) as WorkLog[];
  const books = (booksData ?? []) as Book[];
  const monthly = computeMonthlyEarnings(workLogs);
  const totalEarned = workLogs.reduce((s, l) => s + Number(l.earnings), 0);

  return (
    <div>
      <PageHeader
        title="Academics & Work"
        description="Track assignments and log your work hours."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log work</CardTitle>
            <CardDescription>Earnings calculate automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkLogForm />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assignments yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.course}</TableCell>
                    <TableCell>{a.title}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(a.due_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[a.priority]}>
                        {a.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AssignmentStatusSelect id={a.id} status={a.status} />
                    </TableCell>
                    <TableCell>
                      <DeleteButton
                        confirmText="Delete this assignment?"
                        action={async () => {
                          "use server";
                          await deleteAssignment(a.id);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly earnings</CardTitle>
            <CardDescription>
              Total to date: {formatCurrency(totalEarned)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeBarChart
              data={monthly}
              emptyText="Log work to see monthly earnings."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent work log</CardTitle>
          </CardHeader>
          <CardContent>
            {workLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No work logged yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workLogs.slice(0, 30).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(l.work_date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l.hours}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(Number(l.pay_rate))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(Number(l.earnings))}
                      </TableCell>
                      <TableCell>
                        <DeleteButton
                          confirmText="Delete this entry?"
                          action={async () => {
                            "use server";
                            await deleteWorkLog(l.id);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reading list</CardTitle>
          <CardDescription>Books you&apos;d like to read.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReadingList books={books} />
        </CardContent>
      </Card>
    </div>
  );
}
