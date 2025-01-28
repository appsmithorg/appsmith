import type { PayloadAction } from "@reduxjs/toolkit";

export const blockingActionSagas: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {};

export const nonBlockingActionSagas: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action: PayloadAction<any>) => Generator<any>
> = {};
