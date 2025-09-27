const API_BASE_URL = "http://localhost:4000/api/v1"

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

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    console.log("[v0] Using API Base URL:", this.baseURL)
    // Load tokens from localStorage on client side
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("accessToken")
      this.refreshToken = localStorage.getItem("refreshToken")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    console.log("[v0] Making API request to:", url)
    console.log("[v0] Request options:", { method: options.method || "GET", hasAuth: !!this.accessToken })

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        mode: "cors",
        credentials: "omit",
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      // Handle 401 - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        console.log("[v0] Attempting token refresh...")
        const refreshed = await this.refreshAccessToken()
        if (refreshed) {
          // Retry the original request once
          headers.Authorization = `Bearer ${this.accessToken}`
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            mode: "cors",
            credentials: "omit",
          })

          if (retryResponse.ok) {
            return await retryResponse.json()
          }
        }

        // If refresh failed or retry failed, clear tokens and redirect to login
        this.clearTokens()
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Authentication failed")
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.log("[v0] API Error:", errorMessage)
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log("[v0] API Response success:", !!responseData)
      return responseData
    } catch (error) {
      console.error("[v0] API request failed:", error)
      console.error("[v0] Request URL:", url)
      console.error("[v0] Error type:", error instanceof TypeError ? "Network/CORS" : "Other")

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(`No se puede conectar al servidor backend en ${this.baseURL}. 
        
Asegúrate de que:
1. El servidor backend esté ejecutándose en el puerto 4000
2. La URL sea http://localhost:4000/api/v1
3. El servidor tenga CORS configurado correctamente

Si estás usando una URL diferente, configura la variable de entorno NEXT_PUBLIC_API_BASE_URL.`)
      }

      throw error
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        this.setAccessToken(data.accessToken)
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
    }

    return false
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
    }
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken)
    }
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken)
    }

    return response
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await this.request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        })
      } catch (error) {
        console.error("Logout request failed:", error)
      }
    }
    this.clearTokens()
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
    return this.request<string[]>("/roles")
  }

  // Territorios endpoints
  async getTerritorios() {
    return this.request<Array<{ territorio_id: number; codigo: string; nombre: string }>>("/territorios")
  }

  async getTerritorioSectores(id: number, includeStats = false) {
    return this.request(`/territorios/${id}/sectores?includeStats=${includeStats}`)
  }

  // Sectores endpoints
  async getSectores(params?: { territorio_id?: number; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params?.territorio_id) searchParams.set("territorio_id", params.territorio_id.toString())
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())

    return this.request(`/sectores?${searchParams.toString()}`)
  }

  async createSector(sectorData: { territorio_id: number; nombre: string; geom: any }) {
    // TODO: confirm exact payload in current backend (might use referencia_lat/referencia_lng instead of geom)
    return this.request<{ sector_id: number }>("/sectores", {
      method: "POST",
      body: JSON.stringify(sectorData),
    })
  }

  async getSectorById(id: number) {
    return this.request(`/sectores/${id}`)
  }

  async updateSector(id: number, sectorData: any) {
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

    return this.request(`/metricas?${searchParams.toString()}`)
  }

  async bulkUpdateMetricas(metricas: MetricaInput[]) {
    return this.request<{ message: string; rows_processed: number }>("/metricas", {
      method: "PUT",
      body: JSON.stringify(metricas),
    })
  }
}

export const apiClient = new ApiClient()
