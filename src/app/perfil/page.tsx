"use client";
import { useEffect, useState } from "react";
import { getMe, updateMe, changeMyPassword } from "@/src/services/user.service";

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Tema oscuro/claro (persistido en localStorage)
  const [theme, setTheme] = useState<"light"|"dark">(
    (typeof window !== "undefined" && (localStorage.getItem("theme") as any)) || "light"
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Carga de perfil
  useEffect(() => { getMe().then(setUser).catch(() => {}); }, []);

  // Formulario de datos básicos
  const [nombre, setNombre] = useState(""); 
  const [telefono, setTelefono] = useState("");
  const [avatar, setAvatar] = useState("");
  const [puesto, setPuesto] = useState("");

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre || "");
    setTelefono(user.telefono || "");
    setAvatar(user.avatar_url || "");
    setPuesto(user.puesto || "");
  }, [user]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    try {
      const updated = await updateMe({ nombre, telefono, avatar_url: avatar, puesto });
      setUser(updated); setMsg("Perfil actualizado.");
    } catch (e:any) { setMsg(e?.message || "No se pudo actualizar"); }
    finally { setSaving(false); }
  }

  // Cambio de contraseña
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [changing, setChanging] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");

  async function onChangePwd(e: React.FormEvent) {
    e.preventDefault(); setChanging(true); setPwdMsg("");
    try { 
      await changeMyPassword(currentPwd, newPwd); 
      setCurrentPwd(""); setNewPwd(""); setPwdMsg("Contraseña actualizada.");
    } catch (e:any) { setPwdMsg(e?.message || "No se pudo cambiar la contraseña"); }
    finally { setChanging(false); }
  }

  if (!user) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold dark:text-white">Mi Perfil</h1>
        <button
          className="rounded-md border px-3 py-2 dark:border-zinc-700 dark:text-zinc-200"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
        </button>
      </header>

      {/* Datos visibles del perfil */}
      <section className="rounded-xl border p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4 mb-4">
          <img src={avatar || user.avatar_url || "https://i.pravatar.cc/120"} className="h-16 w-16 rounded-full object-cover" />
          <div>
            <div className="text-lg font-medium dark:text-white">{user.nombre || user.email}</div>
            <div className="text-sm text-gray-500 dark:text-zinc-400">{user.email}</div>
          </div>
        </div>

        <form onSubmit={onSaveProfile} className="grid md:grid-cols-2 gap-4">
          <div><label>Nombre</label>
            <input className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={nombre} onChange={e=>setNombre(e.target.value)} />
          </div>
          <div><label>Teléfono</label>
            <input className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
          <div className="md:col-span-2"><label>Avatar URL</label>
            <input className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={avatar} onChange={e=>setAvatar(e.target.value)} />
          </div>
          <div className="md:col-span-2"><label>Puesto</label>
            <input className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={puesto} onChange={e=>setPuesto(e.target.value)} />
          </div>

          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600 dark:text-zinc-300">{msg}</span>
            <button className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
                    disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</button>
          </div>
        </form>
      </section>

      {/* Cambio de contraseña */}
      <section className="rounded-xl border p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium mb-3 dark:text-white">Cambiar contraseña</h2>
        <form onSubmit={onChangePwd} className="grid md:grid-cols-2 gap-4">
          <div><label>Contraseña actual</label>
            <input type="password" className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} required />
          </div>
          <div><label>Nueva contraseña</label>
            <input type="password" className="mt-1 w-full rounded-md border p-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                   value={newPwd} onChange={e=>setNewPwd(e.target.value)} required />
          </div>
          <div className="md:col-span-2 flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600 dark:text-zinc-300">{pwdMsg}</span>
            <button className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
                    disabled={changing}>{changing ? "Cambiando..." : "Actualizar contraseña"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
