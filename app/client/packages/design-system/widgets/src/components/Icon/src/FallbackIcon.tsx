import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FallbackIcon(props: any) {
  // adding height and width to svg to avoid expanded svg when lazy loading
  return <svg data-testid="t--fallback-icon" height={0} width={0} {...props} />;
}

export { FallbackIcon };
