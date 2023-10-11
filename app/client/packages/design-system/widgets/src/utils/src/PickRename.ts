export type PickRename<
  T,
  R extends {
    [K in keyof R]: K extends keyof T ? PropertyKey : "Error: key not in T";
  },
> = { [P in keyof T as P extends keyof R ? R[P] : P]: T[P] };
