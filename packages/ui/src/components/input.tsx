import * as React from "react";

import { cn } from "@mcw/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&.border-red-500]:focus-visible:ring-red-500 [&.border-red-500]:border-red-500",
          className,
        )}
        type={type}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
