'use client'

import { useEffect, useState } from 'react'

const SEXOS = [
  { value: 'M' as const, label: 'Masculino' },
  { value: 'F' as const, label: 'Femenino' },
]

// Ajusta según tus catálogos y restricciones de la BD (2-4 letras)
const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'qeq', label: "Q’eqchi’" },
  { value: 'kaq', label: 'Kaqchikel' },
]

export type PersonaFormValues = {
  nombres: string
  apellidos: string
  sexo: 'M' | 'F'
  // Usamos fecha_nac para alinear con API actual; produce YYYY-MM-DD
  fecha_nac?: string
  dpi?: string
  idioma?: string
}

export default function PersonaForm({
  mode,
  initial,
  onSubmit,
  submitting,
}: {
  mode: 'create' | 'edit'
  initial?: Partial<PersonaFormValues>
  onSubmit: (values: PersonaFormValues) => Promise<void> | void
  submitting?: boolean
}) {
  const [f, setF] = useState<PersonaFormValues>({
    nombres: initial?.nombres ?? '',
    apellidos: initial?.apellidos ?? '',
    sexo: (initial?.sexo as 'M' | 'F') ?? 'F',
    fecha_nac: initial?.fecha_nac ?? '',
    dpi: initial?.dpi ?? '',
    idioma: initial?.idioma ?? '',
  })
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setF({
      nombres: initial?.nombres ?? '',
      apellidos: initial?.apellidos ?? '',
      sexo: (initial?.sexo as 'M' | 'F') ?? 'F',
      fecha_nac: initial?.fecha_nac ?? '',
      dpi: initial?.dpi ?? '',
      idioma: initial?.idioma ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initial?.nombres,
    initial?.apellidos,
    initial?.sexo,
    initial?.fecha_nac,
    initial?.dpi,
    initial?.idioma,
  ])

  function isFuture(dateStr?: string) {
    if (!dateStr) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(dateStr)
    return d.getTime() > today.getTime()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!f.nombres.trim() || !f.apellidos.trim()) {
      setErr('Nombres y apellidos son obligatorios.')
      return
    }
    if (isFuture(f.fecha_nac)) {
      setErr('La fecha de nacimiento no puede ser futura.')
      return
    }

    await onSubmit({
      nombres: f.nombres.trim(),
      apellidos: f.apellidos.trim(),
      sexo: f.sexo,
      fecha_nac: f.fecha_nac || undefined,
      dpi: f.dpi?.trim() || undefined,
      idioma: f.idioma || undefined,
    })
  }

  const maxDate = new Date().toISOString().slice(0, 10)

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {err && <div className="rounded border border-red-300 bg-red-50 p-2 text-red-700">{err}</div>}

      <div>
        <label className="block text-sm font-medium">Nombres *</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={f.nombres}
          onChange={(e) => setF({ ...f, nombres: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Apellidos *</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={f.apellidos}
          onChange={(e) => setF({ ...f, apellidos: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Sexo *</label>
        <select
          className="mt-1 w-full border rounded p-2"
          value={f.sexo}
          onChange={(e) => setF({ ...f, sexo: e.target.value as 'M' | 'F' })}
        >
          {SEXOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha de Nacimiento (opcional)</label>
        <input
          type="date"
          className="mt-1 w-full border rounded p-2"
          max={maxDate}
          value={f.fecha_nac || ''}
          onChange={(e) => setF({ ...f, fecha_nac: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">DPI (opcional)</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={f.dpi || ''}
          onChange={(e) => setF({ ...f, dpi: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Idioma (opcional)</label>
        <select
          className="mt-1 w-full border rounded p-2"
          value={f.idioma || ''}
          onChange={(e) => setF({ ...f, idioma: e.target.value || undefined })}
        >
          <option value="">—</option>
          {IDIOMAS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={!!submitting}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {mode === 'create' ? 'Agregar Persona' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
