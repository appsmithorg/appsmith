import React, { cloneElement } from "react";
import { isElement } from "@mantine/utils";
import { useFocusTrap, useMergedRef } from "@mantine/hooks";

export interface FocusTrapProps {
  children: any;
  active?: boolean;
  refProp?: string;
}

export function FocusTrap({
  active = true,
  children,
  refProp = "ref",
}: FocusTrapProps): React.ReactElement {
  const focusTrapRef = useFocusTrap(active);
  const ref = useMergedRef(focusTrapRef, children?.ref);

  if (!isElement(children)) {
    return children;
  }

  return cloneElement(children, { [refProp]: ref });
}

FocusTrap.displayName = "@mantine/core/FocusTrap";
