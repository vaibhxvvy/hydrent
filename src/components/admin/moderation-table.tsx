"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ModerationQueueItem } from "@/lib/types";

export function ModerationTable({ data }: { data: ModerationQueueItem[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo<ColumnDef<ModerationQueueItem>[]>(
    () => [
      {
        accessorKey: "label",
        header: "Queue item",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.label}</p>
            <p className="text-xs text-muted-foreground">{row.original.reason}</p>
          </div>
        ),
      },
      {
        accessorKey: "locality",
        header: "Locality",
      },
      {
        accessorKey: "risk",
        header: "Risk",
        cell: ({ row }) => (
          <Badge variant={row.original.risk === "high" ? "warning" : "muted"}>
            {row.original.risk}
          </Badge>
        ),
      },
      {
        accessorKey: "anomalyScore",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Anomaly
            <ArrowUpDown className="size-3" aria-hidden="true" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-mono">{row.original.anomalyScore}</span>,
      },
      {
        accessorKey: "suggestedAction",
        header: "Action",
        cell: ({ row }) => row.original.suggestedAction.replaceAll("_", " "),
      },
    ],
    [],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
