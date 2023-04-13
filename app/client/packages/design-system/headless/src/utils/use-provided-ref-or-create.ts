import React from "react";

/**
 * There are some situations where we only want to create a new ref if one is not provided to a component
 * or hook as a prop. However, due to the `rules-of-hooks`, we cannot conditionally make a call to `React.useRef`
 * only in the situations where the ref is not provided as a prop.
 * This hook aims to encapsulate that logic, so the consumer doesn't need to be concerned with violating `rules-of-hooks`.
 * @param providedRef The ref to use - if undefined, will use the ref from a call to React.useRef
 * @type TRef The type of the RefObject which should be created.
 */
export function useProvidedRefOrCreate<TRef>(
  providedRef?: React.RefObject<TRef>,
): React.RefObject<TRef> {
  const createdRef = React.useRef<TRef>(null);
  return providedRef ?? createdRef;
}
