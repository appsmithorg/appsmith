import type { PayloadAction } from "@reduxjs/toolkit";

// ! case: can we rethink the types
export const gitRequestBlockingActionsEE: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {};

export const gitRequestNonBlockingActionsEE: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {};
