import Link from "next/link"

import { PageShell } from "@/components/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type Row = {
  id: string
  status: string
  final_price: number | string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export async function ManagerSubscriptionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("membership_subscriptions")
    .select("id,status,final_price,users:member_id(full_name),membership_packages(name)")
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as unknown as Row[]

  return (
    <PageShell
      eyebrow="Manager"
      title="Subscriptions"
      description="Monitor member subscriptions across setup, payment, and activation."
    >
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.users?.full_name ?? "Member"}
                </TableCell>
                <TableCell>{row.membership_packages?.name ?? "Membership"}</TableCell>
                <TableCell>
                  <Badge>{row.status.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell>{currency.format(Number(row.final_price) || 0)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/request/${row.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
