export const qFilter = (rows, q, keys) =>
  !q.trim()
    ? rows
    : rows.filter((r) =>
        keys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(q.toLowerCase())
        )
      );

export const getOccurrenceCode = (name = "") => {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return trimmed.length >= 3 ? trimmed.substring(0, 3).toUpperCase() : trimmed.toUpperCase();
};

export const normalizeCategory = (row = {}) => ({
  catId: Number(row.catId ?? row.ScheduleCategoryId ?? 0),
  name: row.name ?? row.CategoryName ?? "",
  description: row.description ?? row.Description ?? "",
  isActive: row.isActive ?? row.IsActive ?? true,
});

