import { getOwnerOverviewPageProps } from "./owner-overview-data"
import { OwnerOverviewPage } from "./OwnerOverviewPage"

export async function OwnerOverview() {
  const overviewProps = await getOwnerOverviewPageProps()

  return <OwnerOverviewPage {...overviewProps} />
}
