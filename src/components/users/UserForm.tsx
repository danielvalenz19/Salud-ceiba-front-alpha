"use client"

import React, { useEffect, useState } from 'react'
import type { UserDTO } from '../../lib/api/users'

type Props = {
  mode: 'create' | 'edit'
  initial?: Partial<UserDTO>
  onSubmit: (values: {
    nombre: string
    email: string
    password?: string
    rol: 'admin' | 'user'
    activo?: boolean | number
  }) => Promise<void> | void
  submitting?: boolean
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Usuario' },
] as const

export default function UserForm({ mode, initial, onSubmit, submitting }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [rol, setRol] = useState<'admin' | 'user'>((initial?.rol as any) ?? 'user')
  const [password, setPassword] = useState('')
  const [activo, setActivo] = useState(
    typeof initial?.activo === 'number' ? initial!.activo === 1 : Boolean(initial?.activo ?? true),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setNombre(initial?.nombre ?? '')
    setEmail(initial?.email ?? '')
    setRol(((initial?.rol as any) ?? 'user'))
    setActivo(typeof initial?.activo === 'number' ? initial!.activo === 1 : Boolean(initial?.activo ?? true))
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSubmit({ nombre, email, rol, ...(mode === 'create' ? { password } : {}), activo })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <div className="rounded border border-red-300 bg-red-50 p-2 text-red-700">{error}</div>}

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Nombre</label>
        <input className="rounded border p-2" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Email</label>
        <input
          type="email"
          className="rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required={mode === 'create'}
        />
      </div>

      {mode === 'create' && (
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Password</label>
          <input type="password" className="rounded border p-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
      )}

      <div className="flex flex-col">
        <label className="mb-1 font-medium">Rol</label>
        <select className="rounded border p-2" value={rol} onChange={(e) => setRol(e.target.value as any)} required>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input id="activo" type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        <label htmlFor="activo">Activo</label>
      </div>

      <button type="submit" disabled={Boolean(submitting)} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
      </button>
    </form>
  )
}
