import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import { MemberAcceptedPtCard } from "./MemberAcceptedPtCard"
import { MemberCancelSubscriptionCard } from "./MemberCancelSubscriptionCard"
import { MemberPaymentSummaryCard } from "./MemberPaymentSummaryCard"
import { MemberPtAssignmentDecisionCard } from "./MemberPtAssignmentDecisionCard"
import { MemberPtPreferenceCard } from "./MemberPtPreferenceCard"
import { MemberSubscriptionCheckoutSection } from "./MemberSubscriptionCheckoutSection"
import { MemberSubscriptionStatusCard } from "./MemberSubscriptionStatusCard"
import { getMemberSubscriptionDetailData } from "@/lib/features/member/subscriptions/detail-data"

type Props = {
  subscriptionId: string
}

export async function MemberSubscriptionDetailPage({ subscriptionId }: Props) {
  const {
    assignments,
    error,
    preference,
    pts,
    replacementSubscriptions,
    subscription,
  } = await getMemberSubscriptionDetailData(subscriptionId)
  const pendingAssignment = assignments.find(
    (assignment) => assignment.status === "pending_member_decision"
  )
  const acceptedAssignment = assignments.find(
    (assignment) => assignment.status === "accepted"
  )
  const isPendingPayment = subscription?.status === "pending_payment"
  const isPtSubscription = Boolean(subscription?.has_pt_snapshot)
  const isPtSetupPending = subscription?.status === "pending_pt_setup"
  const showCheckout = Boolean(
    subscription &&
    isPendingPayment &&
    (!isPtSubscription || acceptedAssignment)
  )
  const showPtWorkflow = Boolean(
    subscription && isPtSubscription && isPtSetupPending
  )
  const showPreferenceForm = Boolean(showPtWorkflow && !pendingAssignment)
  const showAcceptedSummary = Boolean(
    subscription && acceptedAssignment && !showCheckout
  )
  const showStatusCard = Boolean(subscription && !showCheckout)
  const showMainColumn = Boolean(
    showStatusCard ||
    showPreferenceForm ||
    pendingAssignment ||
    showAcceptedSummary
  )

  return (
    <PageShell
      eyebrow="Member"
      title={subscription?.membership_packages?.name ?? "Subscription"}
      description="Complete PT setup, accept assignment, and manage payment."
      backHref="/subscriptions"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscription could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {subscription ? (
        <div
          className={cn(
            "grid gap-4",
            showCheckout
              ? "lg:grid-cols-[minmax(0,1fr)_360px]"
              : showMainColumn
                ? "xl:grid-cols-[1fr_420px]"
                : "lg:grid-cols-[minmax(0,1fr)_360px]"
          )}
        >
          {showCheckout ? (
            <MemberSubscriptionCheckoutSection
              replacementSubscriptions={replacementSubscriptions}
              subscription={subscription}
            />
          ) : (
            <>
              {showMainColumn ? (
                <div className="grid gap-4">
                  {showStatusCard ? (
                    <MemberSubscriptionStatusCard subscription={subscription} />
                  ) : null}

                  {showPreferenceForm ? (
                    <MemberPtPreferenceCard
                      preference={preference}
                      pts={pts}
                      subscription={subscription}
                    />
                  ) : null}

                  {showPtWorkflow && pendingAssignment ? (
                    <MemberPtAssignmentDecisionCard
                      assignment={pendingAssignment}
                      subscription={subscription}
                    />
                  ) : showAcceptedSummary && acceptedAssignment ? (
                    <MemberAcceptedPtCard assignment={acceptedAssignment} />
                  ) : null}
                </div>
              ) : null}

              <div className="grid content-start gap-4">
                <MemberPaymentSummaryCard subscription={subscription} />

                {subscription.status === "pending_pt_setup" ? (
                  <MemberCancelSubscriptionCard subscription={subscription} />
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </PageShell>
  )
}
