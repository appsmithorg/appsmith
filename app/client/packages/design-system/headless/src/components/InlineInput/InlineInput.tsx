import React from "react";

export interface InlineInputProps
  extends React.ComponentPropsWithoutRef<"div"> {
  label: React.ReactNode;
  description: React.ReactNode;
  id: string;
  isDisabled?: boolean;
  error: React.ReactNode;
}

export function InlineInput(props: InlineInputProps) {
  const {
    children,
    description,
    error,
    id,
    isDisabled: disabled,
    label,
    ...rest
  } = props;

  return (
    <div className="inline-input" {...rest}>
      {children}

      <div className="label-wrapper">
        {label && (
          <label className="label" data-disabled={disabled} htmlFor={id}>
            {label}
          </label>
        )}

        {description && <span className="description">{description}</span>}
        {error && error !== "boolean" && <span className="error">{error}</span>}
      </div>
    </div>
  );
}
