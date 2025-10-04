'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserForm from '../../../components/users/UserForm'
import { createUser } from '../../../lib/api/users'
import { compact } from '../../../lib/clean'
import { isAdmin } from '../../../lib/session'

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  if (!isAdmin()) return <div className="p-6">No autorizado.</div>

  async function handleCreate(values: any) {
    setSaving(true)
    try {
      const payload = compact({
        nombre: (values.nombre ?? '').trim(),
        email: (values.email ?? '').trim(),
        password: (values.password ?? '').trim(),
        rol: values.rol,
      }) as { nombre: string; email: string; password: string; rol: 'admin' | 'user' }
      await createUser(payload)
      router.push('/usuarios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Nuevo usuario</h1>
      <UserForm mode="create" onSubmit={handleCreate} submitting={saving} />
    </div>
  )
}
