import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const describedBy = error ? `${id ?? props.name ?? "input"}-error` : undefined;
    return (
      <div className="ui-input-wrapper">
        <input
          ref={ref}
          id={id}
          className={cn("ui-input", className)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />
        {error && (
          <span id={describedBy} className="ui-input-error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
