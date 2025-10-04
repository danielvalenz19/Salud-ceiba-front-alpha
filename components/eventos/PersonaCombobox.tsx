"use client"

import { useEffect, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, User } from "lucide-react"
import { apiClient, type PersonaBasic } from "@/lib/api"

export default function PersonaCombobox({
  value,
  onChange,
}: { value: number | null; onChange: (id: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PersonaBasic[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const res = await apiClient.getPersonas({ q, page: 1, limit: 10 })
        if (!ignore && res.data) setItems(res.data)
      } catch {
        if (!ignore) setItems([])
      }
    })()
    return () => {
      ignore = true
    }
  }, [q])

  const selected = items.find((p) => p.persona_id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {selected ? `${selected.nombres} ${selected.apellidos} (ID: ${selected.persona_id})` : "Buscar persona…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command shouldFilter={false}>
          <CommandInput value={q} onValueChange={setQ} placeholder="Escribe nombre o DPI…" />
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandGroup>
            {items.map((p) => (
              <CommandItem
                key={p.persona_id}
                value={String(p.persona_id)}
                onSelect={() => {
                  onChange(p.persona_id)
                  setOpen(false)
                }}
              >
                <User className="mr-2 h-4 w-4" />
                {p.nombres} {p.apellidos}
                <span className="ml-auto text-xs text-muted-foreground">ID: {p.persona_id}</span>
              </CommandItem>
            ))}
            <CommandItem
              value="ninguna"
              onSelect={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              <span className="text-muted-foreground">Sin persona</span>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
