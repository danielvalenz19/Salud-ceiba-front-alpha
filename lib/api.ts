import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1"

export interface ApiResponse<T> {
  data?: T
  meta?: {
    page: number
    limit: number
    total: number
  }
  message?: string
  error?: string
}

export interface User {
  user_id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  creado_en: string
  persona_id?: number
}

export interface PersonaBasic {
  persona_id: number
  nombres: string
  apellidos: string
  dpi?: string
  sexo: "M" | "F"
  fecha_nac?: string
}

export interface PersonaDetail extends PersonaBasic {
  historial: any[] // TODO: specify exact structure if advanced visualization is required
}

export interface Evento {
  evento_id: number
  persona_id?: number
  ind_id: number
  valor_num?: number
  valor_texto?: string
  fecha_evento: string
  // TODO: other fields as needed
}

export interface MetricaInput {
  ind_id: number
  territorio_id: number
  anio: number
  mes: number
  valor_num: number
  valor_den?: number
}

// Helper type for roles returned by the backend
type Role = { role_id: number; name: string }

type LoginResponse = { accessToken: string; refreshToken: string }

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null
  private refreshTokenValue: string | null = null
  private instance: AxiosInstance

  constructor() {
    this.baseURL = API_BASE_URL
    console.log("[api] Using API Base URL:", this.baseURL)
    // Load tokens from localStorage on client side
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshTokenValue = localStorage.getItem("refreshToken")
    }

    this.instance = axios.create({
      baseURL: this.baseURL,
      headers: { "Content-Type": "application/json" },
      withCredentials: false,
    })

    // Inject Authorization header
    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : this.accessToken
      if (token) {
        // Ensure headers exists and set Authorization safely for Axios v1
        if (!config.headers) {
          config.headers = {} as any
        }
        // Use bracket notation to avoid type narrowing issues
        ;(config.headers as any)["Authorization"] = `Bearer ${token}`
      }
      return config
    })

    // Handle 401 with single-flight refresh
    let isRefreshing = false
    let queue: Array<(t: string) => void> = []
    const flushQueue = (t: string) => {
      queue.forEach((cb) => cb(t))
      queue = []
    }

    this.instance.interceptors.response.use(
      (r: AxiosResponse) => r,
      async (error: AxiosError) => {
        const original: any = error.config
        if (error.response?.status === 401 && !original?._retry) {
          original._retry = true

          if (isRefreshing) {
            return new Promise((resolve) => {
              queue.push((newToken) => {
                original.headers.Authorization = `Bearer ${newToken}`
                resolve(this.instance(original))
              })
            })
          }

          try {
            isRefreshing = true
            const newToken = await this.refreshAccessToken()
            flushQueue(newToken)
            original.headers.Authorization = `Bearer ${newToken}`
            return this.instance(original)
          } catch (e) {
            this.clearTokens()
            if (typeof window !== "undefined") window.location.href = "/login"
            return Promise.reject(e)
          } finally {
            isRefreshing = false
          }
        }
        return Promise.reject(error)
      },
    )
  }

  // Adapter to keep existing method signatures using RequestInit-like options
  // Normaliza la respuesta de la API para siempre devolver ApiResponse<T>.
  // Si la API ya responde { data, meta, message, error } lo respetamos,
  // si responde un objeto/array/valor plano lo envolvemos en { data: ... }.
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const method = (options.method || "GET").toLowerCase() as any;
    let data: any;
    if (options.body) {
      try { data = typeof options.body === "string" ? JSON.parse(options.body) : options.body; }
      catch { data = options.body; }
    }

    const resp = await this.instance.request({ url: endpoint, method, data, headers: options.headers as any });
    const raw = resp.data;

    // Si ya viene como ApiResponse, devuélvelo tal cual
    if (raw && typeof raw === "object" && ("data" in raw || "meta" in raw || "message" in raw || "error" in raw)) {
      return raw as ApiResponse<T>;
    }
    // Si viene plano (objeto/array/valor), envuélvelo
    return { data: raw as T };
  }

  // ---------- token helpers ----------
  private setAccessToken(accessToken: string) {
    this.accessToken = accessToken
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
    }
  }

  setTokens(at: string, rt: string) {
    this.accessToken = at
    this.refreshTokenValue = rt
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", at)
      localStorage.setItem("refreshToken", rt)
    }
  }

  clearTokens() {
    this.accessToken = null
    this.refreshTokenValue = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
  }

  private getRefreshToken() {
    return typeof window !== "undefined" ? localStorage.getItem("refreshToken") : this.refreshTokenValue
  }

  isAuthenticated(): boolean {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : this.accessToken
    return !!token
  }

  // ---------- AUTH ----------
  async login(email: string, password: string) {
    const { data } = await this.instance.post<LoginResponse>("/auth/login", { email, password })
    if (data?.accessToken && data?.refreshToken) this.setTokens(data.accessToken, data.refreshToken)
    return { data }
  }

  async logout() {
    const rt = this.getRefreshToken()
    try {
      if (rt) await this.instance.post("/auth/logout", { refreshToken: rt })
    } finally {
      this.clearTokens()
    }
  }

  // Internal helper used by interceptor. Returns new accessToken
  private async refreshAccessToken(): Promise<string> {
    const rt = this.getRefreshToken()
    if (!rt) throw new Error("No refresh token")
    const { data } = await axios.post<{ accessToken: string }>(`${this.baseURL}/auth/refresh`, { refreshToken: rt })
    if (!data.accessToken) throw new Error("Invalid refresh response")
    this.setAccessToken(data.accessToken)
    return data.accessToken
  }

  // Public method used by UI to extend session: only refreshes tokens and returns new accessToken
  async refreshToken(): Promise<ApiResponse<{ accessToken?: string }>> {
    try {
      const newToken = await this.refreshAccessToken()
      return { data: { accessToken: newToken } }
    } catch (e) {
      return { data: {} }
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      // Prefer /auth/me if available
      return await this.request<User>("/auth/me")
    } catch (e: any) {
      // Fallback to /users/me if 404
      if (e?.response?.status === 404) {
        return await this.request<User>("/users/me")
      }
      throw e
    }
  }

  // Users endpoints
  async getUsers(params?: { page?: number; limit?: number; rol?: string; activo?: boolean; q?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.rol) searchParams.set("rol", params.rol)
    if (params?.activo !== undefined) searchParams.set("activo", params.activo.toString())
    if (params?.q) searchParams.set("q", params.q)

    return this.request<User[]>(`/users?${searchParams.toString()}`)
  }

  async createUser(userData: { nombre: string; email: string; rol: string; password: string; persona_id?: number }) {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getUserById(id: number) {
    return this.request<User>(`/users/${id}`)
  }

  async updateUser(id: number, userData: Partial<User>) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    })
  }

  async getRoles() {
    // El backend devuelve Role[] ({ role_id, name }). El frontend espera string[] (nombres).
    const resp = await this.request<Role[]>('/roles')
    return { data: (resp.data ?? []).map((r) => r.name) }
  }

  // Territorios endpoints
  async getTerritorios() {
    return this.request<Array<{ territorio_id: number; codigo: string; nombre: string }>>("/territorios")
  }

  async createTerritorio(payload: { codigo: string; nombre: string }) {
    return this.request<{ territorio_id: number; codigo: string; nombre: string }>("/territorios", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async updateTerritorio(id: number, payload: { codigo?: string; nombre?: string }) {
    return this.request<{ territorio_id: number; codigo: string; nombre: string } | { message: string }>(`/territorios/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  }

  async getTerritorioSectores(id: number, includeStats = false) {
    // Normaliza la respuesta del backend para soportar tres formas posibles:
    // 1) Backend viejo: devuelve directamente un array de sectores -> [ ... ]
    // 2) Backend alineado (OpenAPI): devuelve { territorio: {...}, sectores: [...] }
    // 3) Backend ya en la forma que el frontend usa: { territorio_id, codigo, nombre, sectores }
    const resp = await this.request<any>(`/territorios/${id}/sectores?includeStats=${includeStats}`)
    const raw = resp.data

    // Caso 1: viene solo un array de sectores
    if (Array.isArray(raw)) {
      return { data: { territorio_id: id, codigo: "", nombre: "", sectores: raw } }
    }

    // Caso 2: viene { territorio: {...}, sectores: [...] } -> convertir a forma plana esperada
    if (raw && typeof raw === "object" && "territorio" in raw && "sectores" in raw) {
      const territorio = raw.territorio || { territorio_id: id }
      const sectores = raw.sectores || []
      return { data: { ...(territorio as any), sectores } }
    }

    // Caso 3: ya viene en la forma { territorio_id, codigo, nombre, sectores }
    return resp
  }

  // Sectores endpoints
  async getSectores(params?: { territorio_id?: number; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.territorio_id) searchParams.set("territorio_id", params.territorio_id.toString())
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request(`/sectores?${searchParams.toString()}`)
  }

  /**
   * Crear sector
   * Backend exige: territorio_id, nombre, referencia_lat, referencia_lng
   */
  async createSector(payload: {
    territorio_id: number
    nombre: string
    referencia_lat: number
    referencia_lng: number
  }) {
    return this.request<{ sector_id: number }>("/sectores", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async getSectorById(id: number) {
    return this.request(`/sectores/${id}`)
  }

  /**
   * Actualizar sector
   * Acepta nombre y/o referencia_lat/lng (números, 0 es válido)
   */
  async updateSector(
    id: number,
    sectorData: { nombre?: string; referencia_lat?: number; referencia_lng?: number },
  ) {
    return this.request(`/sectores/${id}`, {
      method: "PUT",
      body: JSON.stringify(sectorData),
    })
  }

  async deleteSector(id: number) {
    return this.request(`/sectores/${id}`, {
      method: "DELETE",
    })
  }

  async getSectorViviendas(id: number, params?: { withGPS?: boolean; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.withGPS) searchParams.set("withGPS", "true")
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request(`/sectores/${id}/viviendas?${searchParams.toString()}`)
  }

  // Viviendas endpoints
  async listViviendas(params: { page?: number; limit?: number; sector_id?: number; codigo_familia?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.sector_id) searchParams.set("sector_id", params.sector_id.toString())
    if (params?.codigo_familia) searchParams.set("codigo_familia", params.codigo_familia)
    return this.request<any>(`/viviendas?${searchParams.toString()}`)
  }
  async createVivienda(viviendaData: {
    sector_id: number
    codigo_familia: string
    direccion?: string
    lat?: number
    lng?: number
  }) {
    return this.request<{ vivienda_id: number }>("/viviendas", {
      method: "POST",
      body: JSON.stringify(viviendaData),
    })
  }

  async getVivienda(id: number) {
    return this.request<any>(`/viviendas/${id}`)
  }
  async getViviendaById(id: number) {
    return this.request(`/viviendas/${id}`)
  }

  async updateVivienda(id: number, viviendaData: any) {
    return this.request<{ message: string }>(`/viviendas/${id}`, {
      method: "PUT",
      body: JSON.stringify(viviendaData),
    })
  }

  async getViviendaPersonas(id: number, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request<PersonaBasic[]>(`/viviendas/${id}/personas?${searchParams.toString()}`)
  }

  async createPersonaInVivienda(
    viviendaId: number,
    personaData: {
      nombres: string
      apellidos: string
      sexo: "M" | "F"
      fecha_nac: string
      dpi?: string
      idioma?: string
    },
  ) {
    return this.request<{ persona_id: number }>(`/viviendas/${viviendaId}/personas`, {
      method: "POST",
      body: JSON.stringify(personaData),
    })
  }

  // Personas endpoints
  async getPersonas(params?: { q?: string; dpi?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.q) searchParams.set("q", params.q)
    if (params?.dpi) searchParams.set("dpi", params.dpi)
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request<PersonaBasic[]>(`/personas?${searchParams.toString()}`)
  }

  async getPersonaById(id: number) {
    return this.request<PersonaDetail>(`/personas/${id}`)
  }

  async updatePersona(id: number, personaData: Partial<PersonaBasic>) {
    return this.request(`/personas/${id}`, {
      method: "PUT",
      body: JSON.stringify(personaData),
    })
  }

  // Eventos endpoints
  async getEventos(params?: {
    persona_id?: number
    ind_id?: number
    from?: string
    to?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.persona_id) searchParams.set("persona_id", params.persona_id.toString())
    if (params?.ind_id) searchParams.set("ind_id", params.ind_id.toString())
    if (params?.from) searchParams.set("from", params.from)
    if (params?.to) searchParams.set("to", params.to)
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request<Evento[]>(`/eventos?${searchParams.toString()}`)
  }

  async createEvento(eventoData: {
    persona_id: number
    ind_id: number
    valor_num?: number
    valor_texto?: string
    fecha_evento: string
  }) {
    return this.request<{ evento_id: number }>("/eventos", {
      method: "POST",
      body: JSON.stringify(eventoData),
    })
  }

  async getEventoById(id: number) {
    return this.request<Evento>(`/eventos/${id}`)
  }

  // Clinical module endpoints
  async createClinicalEvent(
    module: "vacunacion" | "nutricion" | "reproductiva" | "epidemiologia",
    eventData: {
      persona_id: number | null
      sector_id: number
      ind_id: number
      valor_num?: number
      valor_texto?: string
      lote?: string
      fecha_evento: string
      responsable_id: number
      detalle_json?: any
    },
  ) {
    return this.request<{ evento_id: number }>(`/${module}/eventos`, {
      method: "POST",
      body: JSON.stringify(eventData),
    })
  }

  // Metrics endpoints
  async getMetricas(params?: {
    territorio_id?: number
    ind_id?: number
    periodo_desde?: string
    periodo_hasta?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params?.territorio_id) searchParams.set("territorio_id", params.territorio_id.toString())
    if (params?.ind_id) searchParams.set("ind_id", params.ind_id.toString())
    if (params?.periodo_desde) searchParams.set("periodo_desde", params.periodo_desde)
    if (params?.periodo_hasta) searchParams.set("periodo_hasta", params.periodo_hasta)
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    // Return an array of metricas by default
    return this.request<any[]>(`/metricas?${searchParams.toString()}`)
  }

  async bulkUpdateMetricas(metricas: MetricaInput[]) {
    return this.request<{ message: string; rows_processed: number }>("/metricas", {
      method: "PUT",
      body: JSON.stringify(metricas),
    })
  }

  // Coverage endpoints (vacunacion / nutricion)
  async getVacunacionCoberturas(params: { territorio_id: number; anio: number }) {
    const search = `?territorio_id=${params.territorio_id}&anio=${params.anio}`
    return this.request<any>(`/vacunacion/coberturas${search}`)
  }

  async getNutricionCoberturas(params: { territorio_id: number; anio: number }) {
    const search = `?territorio_id=${params.territorio_id}&anio=${params.anio}`
    return this.request<any>(`/nutricion/coberturas${search}`)
  }

  // Public health endpoints: morbilidad / mortalidad / ambiente
  async getMorbilidadCasos(params?: { causa_id?: number; territorio_id?: number; anio?: number; mes?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.causa_id) searchParams.set('causa_id', params.causa_id.toString())
    if (params?.territorio_id) searchParams.set('territorio_id', params.territorio_id.toString())
    if (params?.anio) searchParams.set('anio', params.anio.toString())
    if (params?.mes) searchParams.set('mes', params.mes.toString())
    return this.request<any[]>(`/salud/morbilidad?${searchParams.toString()}`)
  }

  async createMorbilidadCaso(casoData: { causa_id: number; territorio_id: number; anio: number; mes: number; casos_reportados: number }) {
    return this.request('/salud/morbilidad', { method: 'POST', body: JSON.stringify(casoData) })
  }

  async createMortalidadRegistro(registroData: { causa_id: number; territorio_id: number; anio: number; mes: number; defunciones: number }) {
    return this.request('/salud/mortalidad', { method: 'POST', body: JSON.stringify(registroData) })
  }

  async createAmbienteMetricas(metricas: any[]) {
    return this.request('/salud/ambiente/metricas', { method: 'POST', body: JSON.stringify(metricas) })
  }
}

export const apiClient = new ApiClient()
export type { LoginResponse }
