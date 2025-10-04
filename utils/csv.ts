export function toCSV(rows: Array<Record<string, any>>): string {
  if (!rows || !rows.length) return ""
  const headerSet = rows.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k))
    return set
  }, new Set<string>())
  const headers: string[] = Array.from(headerSet.values())

  const escape = (v: any) => {
    if (v == null) return ""
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const lines = [headers.join(","), ...rows.map((r) => headers.map((h: string) => escape((r as any)[h])).join(","))]
  return lines.join("\n")
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
