'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import UserForm from '../../../../components/users/UserForm'
import { getUserById, updateUser, type UserDTO } from '../../../../lib/api/users'
import { compact } from '../../../../lib/clean'
import { isAdmin } from '../../../../lib/session'

export default function EditarUsuarioPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  if (!isAdmin()) return <div className="p-6">No autorizado.</div>

  useEffect(() => {
    async function load() {
      try {
        const u = await getUserById(params.id)
        setData(u)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function handleUpdate(values: any) {
    setSaving(true)
    try {
      const payload = compact({
        nombre: (values.nombre ?? '').trim(),
        email: (values.email ?? '').trim(),
        rol: values.rol,
        activo: Boolean(values.activo),
      })
      await updateUser(params.id, payload)
      router.push('/usuarios')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Cargando…</div>
  if (!data) return <div className="p-6">No se encontró el usuario.</div>

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Editar usuario #{data.user_id}</h1>
      <UserForm mode="edit" initial={data} onSubmit={handleUpdate} submitting={saving} />
    </div>
  )
}
