import * as React from "react";
import { cn } from "@/lib/utils";

export interface StableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const StableInput = React.forwardRef<HTMLInputElement, StableInputProps>(
  ({ className, type, onValueChange, onChange, ...props }, ref) => {
    // Stable change handler to prevent re-renders
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onValueChange?.(value);
      onChange?.(e);
    }, [onValueChange, onChange]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

StableInput.displayName = "StableInput";

export { StableInput }; 
