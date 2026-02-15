import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

export type InlineErrorProps = {
  /** User-facing message; no raw stack trace. */
  message: string;
  /** Optional technical details (stack, etc.) shown in expandable section. */
  details?: string | null;
  /** When provided, shows a Retry button. */
  onRetry?: () => void;
  /** When provided, shows a Dismiss button that clears the error. */
  onDismiss?: () => void;
  /** Optional class for the container. */
  className?: string;
};

export function InlineError({
  message,
  details,
  onRetry,
  onDismiss,
  className = "",
}: InlineErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const textToCopy = details ? `${message}\n\n---\n${details}` : message;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [textToCopy]);

  return (
    <div
      className={`inline-error ${className}`.trim()}
      role="alert"
      aria-live="polite"
    >
      <p className="inline-error-message">{message}</p>
      <div className="inline-error-actions">
        {onRetry && (
          <Button type="button" variant="default" onClick={onRetry}>
            Retry
          </Button>
        )}
        <Button
          type="button"
          variant="default"
          onClick={handleCopy}
          aria-label="Copy error details"
        >
          {copied ? "Copied" : "Copy details"}
        </Button>
        {details && (
          <button
            type="button"
            className="inline-error-toggle-details"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
          >
            {showDetails ? "Hide technical details" : "Show technical details"}
          </button>
        )}
        {onDismiss && (
          <Button type="button" variant="default" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
      {details && showDetails && (
        <pre className="inline-error-details" aria-hidden>
          {details}
        </pre>
      )}
    </div>
  );
}
