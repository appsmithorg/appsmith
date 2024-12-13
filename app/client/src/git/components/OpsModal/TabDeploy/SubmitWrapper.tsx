import noop from "lodash/noop";
import React, { useCallback } from "react";
import { isMacOrIOS } from "utils/helpers";

interface SubmitWrapperProps {
  children: React.ReactNode;
  onSubmit: () => void;
}

export default function SubmitWrapper({
  children = null,
  onSubmit = noop,
}: SubmitWrapperProps) {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const triggerSubmit = isMacOrIOS()
        ? e.metaKey && e.key === "Enter"
        : e.ctrlKey && e.key === "Enter";

      if (triggerSubmit) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  return <div onKeyDown={onKeyDown}>{children}</div>;
}
