import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

async function test() {
  const { data: facilities } = await supabase.from("gym_facilities").select("*")
  console.log("Total Facilities:", facilities?.length)
  console.log("Facilities:", facilities?.map(f => ({id: f.id, name: f.name, owner: f.owner_id})))

  const { data: packages } = await supabase.from("membership_packages").select("*")
  console.log("Total Packages:", packages?.length)
  console.log("Packages:", packages?.map(p => ({id: p.id, name: p.name, facility: p.facility_id})))
}
test()
