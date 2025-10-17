import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground transition-colors duration-200",
        link: "text-primary underline-offset-4 hover:underline",
        modern: "button-modern",
        userProfile: "user-profile",
      },
      size: {
        default: "h-11 sm:h-10 px-4 py-2 touch-target",
        sm: "h-10 sm:h-9 rounded-md px-3 touch-target",
        lg: "h-12 sm:h-11 rounded-md px-8 touch-target",
        icon: "h-11 w-11 sm:h-10 sm:w-10 touch-target",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Handle userProfile variant with special structure
    if (variant === "userProfile") {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          {...props}
        >
          <div className="user-profile-inner">
            {children}
          </div>
        </Comp>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
