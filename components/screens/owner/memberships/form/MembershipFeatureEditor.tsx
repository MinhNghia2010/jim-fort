"use client"

import { CirclePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MembershipFeatureEditorProps {
  features: string[]
  onChange: (features: string[]) => void
}

export function MembershipFeatureEditor({
  features,
  onChange,
}: MembershipFeatureEditorProps) {
  function updateFeature(index: number, value: string) {
    onChange(
      features.map((feature, featureIndex) =>
        featureIndex === index ? value : feature
      )
    )
  }

  function removeFeature(index: number) {
    onChange(features.filter((_, featureIndex) => featureIndex !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {features.map((feature, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={feature}
            onChange={(event) => updateFeature(index, event.target.value)}
            placeholder="Example: Locker room access"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove feature"
            onClick={() => removeFeature(index)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...features, ""])}
      >
        <CirclePlus data-icon="inline-start" />
        Add feature
      </Button>
    </div>
  )
}
