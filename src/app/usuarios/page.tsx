'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUsers, type UserDTO } from '../../lib/api/users';
import { isAdmin } from '../../lib/session';

export default function UsuariosPage() {
  const [items, setItems] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const admin = isAdmin();

  async function load() {
    setLoading(true);
    try {
      const data = await getUsers();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        {admin && (
          <Link
            href="/usuarios/nuevo"
            className="rounded bg-green-600 px-4 py-2 font-semibold text-white"
          >
            Nuevo
          </Link>
        )}
      </div>

      {loading ? (
        <div>Cargando…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">ID</th>
                <th className="border px-3 py-2 text-left">Nombre</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">Rol</th>
                <th className="border px-3 py-2 text-left">Activo</th>
                <th className="border px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.user_id}>
                  <td className="border px-3 py-2">{u.user_id}</td>
                  <td className="border px-3 py-2">{u.nombre}</td>
                  <td className="border px-3 py-2">{u.email}</td>
                  <td className="border px-3 py-2">{u.rol}</td>
                  <td className="border px-3 py-2">
                    {(typeof u.activo === 'number' ? u.activo === 1 : u.activo) ? 'Sí' : 'No'}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {admin ? (
                      <Link
                        href={`/usuarios/${u.user_id}/editar`}
                        className="rounded bg-blue-600 px-3 py-1 text-white"
                      >
                        Editar
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="border px-3 py-4 text-center" colSpan={6}>
                    Sin registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
