"use client"

import { useMemo } from "react"
import { useCausas } from "@/hooks/useCausas"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Props = {
  token?: string
  value: number | null
  onChange: (id: number | null) => void
  disabled?: boolean
  id?: string
  placeholder?: string
  label?: string
  allowEmpty?: boolean
  className?: string
}

export default function CausaSelect({
  token,
  value,
  onChange,
  disabled,
  id = "causa_id",
  placeholder = "Seleccione una causa",
  label = "Causa",
  allowEmpty = false,
  className,
}: Props) {
  const { causas, loading, error } = useCausas(token)

  const stringValue = value !== null && value !== undefined ? String(value) : ""
  const options = useMemo(() => causas.map((c) => ({ value: String(c.id), label: c.label })), [causas])

  const handleChange = (next: string) => {
    if (!next) {
      onChange(null)
      return
    }

    const parsed = Number(next)
    onChange(Number.isFinite(parsed) ? parsed : null)
  }

  return (
    <div className={className}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select
        value={stringValue}
        onValueChange={handleChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={loading ? "Cargando causas..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? (
            <SelectItem value="">{placeholder}</SelectItem>
          ) : null}
          {loading ? (
            <SelectItem value="__loading" disabled>
              Cargando causas...
            </SelectItem>
          ) : error ? (
            <SelectItem value="__error" disabled>
              ¡{error}!
            </SelectItem>
          ) : options.length === 0 ? (
            <SelectItem value="__empty" disabled>
              Sin causas disponibles
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
