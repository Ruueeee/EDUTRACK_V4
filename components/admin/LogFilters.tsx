"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ACTION_LABELS } from "@/lib/logger"

export function LogFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("userId") ?? "")
  const [from, setFrom] = useState(params.get("from") ?? "")
  const [to, setTo] = useState(params.get("to") ?? "")
  const action = params.get("action") ?? "ALL"

  useEffect(() => {
    setQ(params.get("userId") ?? "")
    setFrom(params.get("from") ?? "")
    setTo(params.get("to") ?? "")
  }, [params])

  const update = (patch: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "ALL") sp.delete(k)
      else sp.set(k, v)
    }
    sp.delete("page")
    router.push(`?${sp.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") update({ userId: q })
        }}
        placeholder="User ID"
        className="h-9 w-48"
      />
      <Select value={action} onValueChange={(v) => update({ action: v })}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All actions</SelectItem>
          {Object.keys(ACTION_LABELS).map((a) => (
            <SelectItem key={a} value={a}>
              {ACTION_LABELS[a]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        onBlur={() => update({ from })}
        className="h-9 w-40"
      />
      <Input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        onBlur={() => update({ to })}
        className="h-9 w-40"
      />
    </div>
  )
}
