"use client";

import { useState, useTransition } from "react";
import {
  addBook,
  updateBookStatus,
  deleteBook,
  type BookStatus,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export type Book = {
  id: string;
  title: string;
  author: string | null;
  status: BookStatus;
};

const STATUS_LABEL: Record<BookStatus, string> = {
  to_read: "To read",
  reading: "Reading",
  read: "Read",
};

export function ReadingList({ books }: { books: Book[] }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isPending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Enter a book title");
      return;
    }
    startTransition(async () => {
      try {
        await addBook({ title: title.trim(), author: author.trim() || null });
        setTitle("");
        setAuthor("");
        toast.success("Added to reading list");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Book title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Author (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add
            </>
          )}
        </Button>
      </form>

      {books.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
          <BookOpen className="h-7 w-7" />
          No books yet — add one you&apos;d like to read.
        </div>
      ) : (
        <ul className="divide-y">
          {books.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{b.title}</p>
                {b.author && (
                  <p className="truncate text-xs text-muted-foreground">{b.author}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {b.status === "read" && <Badge variant="success">Read</Badge>}
                <BookStatusSelect id={b.id} status={b.status} />
                <button
                  type="button"
                  aria-label="Delete book"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (!window.confirm("Remove this book?")) return;
                    startTransition(async () => {
                      try {
                        await deleteBook(b.id);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed");
                      }
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookStatusSelect({ id, status }: { id: string; status: BookStatus }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(v) =>
        startTransition(async () => {
          try {
            await updateBookStatus(id, v as BookStatus);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        })
      }
    >
      <SelectTrigger className="h-8 w-[120px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABEL) as BookStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
