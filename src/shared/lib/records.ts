export type Row = Record<string, unknown>;
export const valueAt = (row: Row, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (value, key) => (value && typeof value === "object" ? (value as Row)[key] : undefined),
      row,
    );
export const textAt = (row: Row, path: string) => String(valueAt(row, path) ?? "");
export const rowsAt = (data: Row, key: string) =>
  (Array.isArray(data[key]) ? data[key] : []) as Row[];
export const splitIDs = (value: unknown) => [
  ...new Set(
    String(value || "")
      .split(/[\s,，]+/)
      .filter(Boolean),
  ),
];
