import type { ComponentType } from "react";
import React, { Suspense, lazy } from "react";

function importIconImpl(importFn: () => Promise<{ default: ComponentType }>) {
  const Icon = lazy(importFn);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function AppsmithLoadable(props: any) {
    return (
      // Using `<svg />` as a loading fallback – to make sure sizes set by <IconWrapper>
      // apply even while the full icon is still loading.
      // And passing all props – if the parent component sets `width` or `height`,
      // we want to make sure it’s applied to the loading fallback as well.
      <Suspense fallback={<svg {...props} />}>
        <Icon {...props} />
      </Suspense>
    );
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IconLoadFailFallback(props: any) {
  return <svg {...props} />;
}

export function importTablerIcon(
  importFn: () => Promise<{ default: ComponentType }>,
): React.ComponentType {
  return importIconImpl(async () =>
    importFn().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn("Failed to load SVG icon:", e);

      return { default: IconLoadFailFallback };
    }),
  );
}
