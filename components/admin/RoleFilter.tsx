"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

export function RoleFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const role = params.get("role") ?? "ALL"
  const [q, setQ] = useState(params.get("q") ?? "")

  useEffect(() => {
    setQ(params.get("q") ?? "")
  }, [params])

  const update = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString())
    if (!value || value === "ALL" || value === "") sp.delete(key)
    else sp.set(key, value)
    sp.delete("page")
    router.push(`?${sp.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("q", q)
        }}
        placeholder="Search name or email"
        className="h-9 w-64"
      />
      <Select value={role} onValueChange={(v) => update("role", v)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All roles</SelectItem>
          <SelectItem value="STUDENT">Student</SelectItem>
          <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
