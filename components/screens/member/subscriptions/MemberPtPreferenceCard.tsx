import { savePtPreference } from "@/app/(main)/member-actions"
import { FormSelect } from "@/components/FormSelect"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import {
  subscriptionWeekdays,
  subscriptionWeeklySlotIndexes,
  sortSubscriptionSlots,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  experienceLevelOptions,
  preferredPtGenderOptions,
} from "./member-subscription-detail-constants"
import type {
  MemberPreferenceRow,
  MemberPtRow,
  MemberSubscriptionRow,
} from "./member-subscription-detail-data"

type MemberPtPreferenceCardProps = {
  preference: MemberPreferenceRow | null
  pts: MemberPtRow[]
  subscription: MemberSubscriptionRow
}

export function MemberPtPreferenceCard({
  preference,
  pts,
  subscription,
}: MemberPtPreferenceCardProps) {
  const preferenceSlots = sortSubscriptionSlots(
    preference?.membership_pt_preference_time_slots
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>PT preferences</CardTitle>
        <CardDescription>
          {preference
            ? "Your request is waiting for the manager response. You can update it until a trainer is proposed."
            : "Send your preferences first so the manager can propose a trainer and schedule."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MemberActionForm
          action={savePtPreference}
          submitLabel={preference ? "Update request" : "Send request"}
          successMessage="PT preference request sent"
        >
          <input type="hidden" name="subscriptionId" value={subscription.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="preferredPtId">Preferred PT</Label>
              <FormSelect
                id="preferredPtId"
                name="preferredPtId"
                defaultValue={preference?.preferred_pt_id ?? "none"}
                options={[
                  { value: "none", label: "No preference" },
                  ...pts.map((pt) => ({
                    value: pt.pt_id,
                    label: pt.users?.full_name ?? "Trainer",
                  })),
                ]}
                placeholder="Select a trainer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="preferredPtGender">PT gender</Label>
              <FormSelect
                id="preferredPtGender"
                name="preferredPtGender"
                defaultValue={preference?.preferred_pt_gender ?? "no_preference"}
                options={preferredPtGenderOptions}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experienceLevel">Experience</Label>
              <FormSelect
                id="experienceLevel"
                name="experienceLevel"
                defaultValue={preference?.experience_level ?? "no_preference"}
                options={experienceLevelOptions}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trainingGoal">Training goal</Label>
            <Textarea
              id="trainingGoal"
              name="trainingGoal"
              defaultValue={preference?.training_goal ?? ""}
            />
          </div>
          <div className="grid gap-3">
            <div>
              <Label>Preferred weekly schedule</Label>
              <p className="text-sm text-muted-foreground">
                Fill the days you want to train. The number of filled days
                becomes your sessions per week.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {subscriptionWeeklySlotIndexes.map((index) => {
                const slot = preferenceSlots.find(
                  (item) => item.day_of_week === index
                )

                return (
                  <div key={index} className="grid gap-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>{subscriptionWeekdays[index]}</Label>
                      {slot ? <Badge variant="secondary">Selected</Badge> : null}
                    </div>
                    <input type="hidden" name={`slotDay${index}`} value={index} />
                    <Input
                      name={`slotStart${index}`}
                      type="time"
                      defaultValue={slot?.start_time.slice(0, 5) ?? ""}
                    />
                    <Input
                      name={`slotEnd${index}`}
                      type="time"
                      defaultValue={slot?.end_time.slice(0, 5) ?? ""}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <Textarea
            name="notes"
            placeholder="Notes for manager"
            defaultValue={preference?.notes ?? ""}
          />
        </MemberActionForm>
      </CardContent>
    </Card>
  )
}
