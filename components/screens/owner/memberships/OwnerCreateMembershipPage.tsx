import { createMembershipPackage } from "@/app/(main)/memberships/actions"
import { getMembershipPackageFormData } from "@/app/(main)/memberships/data"
import { MembershipPackageForm } from "@/components/screens/owner/memberships/form/MembershipPackageForm"

export async function OwnerCreateMembershipPage() {
  const formData = await getMembershipPackageFormData()

  return (
    <MembershipPackageForm
      mode="create"
      data={formData}
      action={createMembershipPackage}
    />
  )
}
