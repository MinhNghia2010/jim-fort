import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSingleRelation } from "@/lib/features/shared/subscriptions/detail-utils"

import { ManagerSubscriptionDetailsCard } from "./ManagerSubscriptionDetailsCard"
import { ManagerSubscriptionMetricGrid } from "./ManagerSubscriptionMetricGrid"
import { ManagerSubscriptionNotFound } from "./ManagerSubscriptionNotFound"
import { ManagerSubscriptionPaymentHistoryCard } from "./ManagerSubscriptionPaymentHistoryCard"
import { ManagerSubscriptionPtSetupCard } from "./ManagerSubscriptionPtSetupCard"
import { ManagerSubscriptionSideCards } from "./ManagerSubscriptionSideCards"
import { getManagerSubscriptionDetailData } from "@/lib/features/manager/subscriptions/detail-data"
import { getTotalPaid } from "@/lib/features/manager/subscriptions/detail-utils"

type Props = {
  subscriptionId: string
}

export async function ManagerSubscriptionDetailPage({ subscriptionId }: Props) {
  const { assignments, error, payments, preference, subscription } =
    await getManagerSubscriptionDetailData(subscriptionId)

  if (!subscription) {
    return (
      <ManagerSubscriptionNotFound
        subscriptionId={subscriptionId}
        errorMessage={error?.message}
      />
    )
  }

  const member = getSingleRelation(subscription.member)
  const plan = getSingleRelation(subscription.package)
  const facility = getSingleRelation(subscription.facility)
  const planName = plan?.name?.trim() || "Membership"
  const memberName = member?.full_name?.trim() || "Member"
  const memberPhone = member?.phone ?? "Not recorded"
  const facilityName = facility?.name?.trim() || "Facility"

  return (
    <PageShell
      backHref="/subscriptions"
      eyebrow="Manager"
      title={planName}
      description={`Review ${memberName}'s membership subscription details.`}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription data could not be fully loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <ManagerSubscriptionMetricGrid subscription={subscription} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <ManagerSubscriptionDetailsCard
            facilityName={facilityName}
            memberName={memberName}
            memberPhone={memberPhone}
            planDescription={
              plan?.description ?? "Membership plan and lifecycle details."
            }
            subscription={subscription}
          />

          <ManagerSubscriptionPaymentHistoryCard
            payments={payments}
            totalPaid={getTotalPaid(payments)}
          />

          {subscription.has_pt_snapshot ? (
            <ManagerSubscriptionPtSetupCard
              assignments={assignments}
              preference={preference}
            />
          ) : null}
        </div>

        <ManagerSubscriptionSideCards
          facilityAddress={facility?.address ?? "Not recorded"}
          facilityName={facilityName}
          facilityPhone={facility?.phone ?? "Not recorded"}
          memberName={memberName}
          memberPhone={memberPhone}
          subscription={subscription}
        />
      </div>
    </PageShell>
  )
}
