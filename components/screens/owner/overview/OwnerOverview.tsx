import { getOwnerOverviewPageProps } from "@/lib/features/owner/overview/data"
import { OwnerOverviewPage } from "./OwnerOverviewPage"

export async function OwnerOverview() {
  const overviewProps = await getOwnerOverviewPageProps()

  return <OwnerOverviewPage {...overviewProps} />
}
