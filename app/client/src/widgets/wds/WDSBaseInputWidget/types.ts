import type { INPUT_TYPES } from "./constants";

export type InputType = (typeof INPUT_TYPES)[keyof typeof INPUT_TYPES];
