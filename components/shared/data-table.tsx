import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

/**
 * 재사용 가능한 데이터 테이블 컴포넌트
 *
 * shadcn/ui Table 기반으로 구현된 범용 테이블입니다.
 *
 * @example
 * ```tsx
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const columns: Column<User>[] = [
 *   { key: "name", label: "이름" },
 *   { key: "email", label: "이메일" },
 *   {
 *     key: "actions",
 *     label: "작업",
 *     render: (user) => (
 *       <Button variant="ghost" size="sm">수정</Button>
 *     ),
 *   },
 * ];
 *
 * <DataTable data={users} columns={columns} />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  emptyMessage = "데이터가 없습니다.",
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || index}>
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
