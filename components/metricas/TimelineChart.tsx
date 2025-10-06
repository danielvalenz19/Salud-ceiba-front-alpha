"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

type Series = { key: string; name: string; color?: string }

type DataPoint = { month: string } & Record<string, number | string>

export function TimelineChart({ data, series }: { data: DataPoint[]; series: Series[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color || "#8884d8"} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
