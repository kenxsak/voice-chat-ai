import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const modernButtonVariants = cva(
  "button-modern relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        primary: "text-white",
        secondary: "text-foreground",
        ghost: "bg-transparent border-transparent",
      },
      size: {
        default: "min-w-[200px] h-[68px] px-6",
        sm: "min-w-[160px] h-[56px] px-4 text-sm",
        lg: "min-w-[240px] h-[76px] px-8 text-lg",
        icon: "w-[68px] h-[68px] min-w-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ModernButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof modernButtonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Convert children to array of spans with animation indices
    const animatedText = React.useMemo(() => {
      if (typeof children === 'string') {
        return children.split('').map((char, index) => (
          <span 
            key={index} 
            style={{ '--i': index } as React.CSSProperties}
            className="inline-block"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))
      }
      return children
    }, [children])

    return (
      <Comp
        className={cn(modernButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Animated outline effect */}
        <div className="outline">
          <div></div>
        </div>
        
        {/* Button content */}
        <div className="state state--default">
          {icon && (
            <div className="icon">
              {icon}
            </div>
          )}
          <p>{animatedText}</p>
        </div>
        
        {/* Success state (hidden by default) */}
        <div className="state state--sent">
          <div className="icon">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 20 20" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p>
            {['S', 'e', 'n', 't', '!'].map((char, index) => (
              <span 
                key={index} 
                style={{ '--i': index } as React.CSSProperties}
                className="inline-block"
              >
                {char}
              </span>
            ))}
          </p>
        </div>
      </Comp>
    )
  }
)
ModernButton.displayName = "ModernButton"

export { ModernButton, modernButtonVariants }
