import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "~/lib/utils"

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-100"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-rose-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className="block h-5 w-5 rounded-full border border-rose-500 bg-white shadow outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
