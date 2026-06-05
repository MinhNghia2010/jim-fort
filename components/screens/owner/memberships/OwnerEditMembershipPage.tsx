import { updateMembershipPackage } from "@/app/(main)/memberships/actions"
import { getMembershipPackageFormData } from "@/app/(main)/memberships/data"
import { MembershipPackageForm } from "@/components/screens/owner/memberships/form/MembershipPackageForm"

interface OwnerEditMembershipPageProps {
  selectedPlanId?: string
}

export async function OwnerEditMembershipPage({
  selectedPlanId,
}: OwnerEditMembershipPageProps) {
  const formData = await getMembershipPackageFormData(selectedPlanId)

  return (
    <MembershipPackageForm
      mode="edit"
      data={formData}
      action={updateMembershipPackage}
    />
  )
}
