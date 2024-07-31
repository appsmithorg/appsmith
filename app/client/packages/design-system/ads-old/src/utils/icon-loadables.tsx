// IMPORTANT: please keep this file in sync with packages/design-system-old/src/utils/icon-loadables.tsx.

import React, { Suspense } from "react";
import type {
  RemixiconReactIconProps,
  RemixiconReactIconComponentType,
} from "remixicon-react";
import * as log from "loglevel";

function IconLoadFailFallback(props: any) {
  return <svg {...props} />;
}

function importIconImpl(
  importFn: () => Promise<{ default: React.ComponentType }>,
) {
  const Icon = React.lazy(importFn);

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

export function importSvg(
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  importFn: () => Promise<typeof import("*.svg")>,
): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  return importIconImpl(async () =>
    importFn()
      .then((m) => ({ default: m.ReactComponent }))
      .catch((e) => {
        log.warn("Failed to load SVG icon:", e);
        return { default: IconLoadFailFallback };
      }),
  );
}

export function importRemixIcon(
  importFn: () => Promise<{ default: RemixiconReactIconComponentType }>,
): React.ComponentType<RemixiconReactIconProps> {
  return importIconImpl(async () =>
    importFn().catch((e) => {
      log.warn("Failed to load SVG icon:", e);
      return { default: IconLoadFailFallback };
    }),
  );
}
