import * as React from "react";

// basically Exclude<React.ClassAttributes<T>["ref"], string>
type UserRef<T> =
  | ((instance: T | null) => void)
  | React.RefObject<T>
  | null
  | undefined;

type Writable<T> = { -readonly [P in keyof T]: T[P] };

const updateRef = <T>(ref: NonNullable<UserRef<T>>, value: T | null) => {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  (ref as Writable<typeof ref>).current = value;
};

const useComposedRef = <T extends HTMLElement>(
  libRef: React.MutableRefObject<T | null>,
  userRef: UserRef<T>,
) => {
  const prevUserRef = React.useRef<UserRef<T>>();

  return React.useCallback(
    (instance: T | null) => {
      libRef.current = instance;

      if (prevUserRef.current) {
        updateRef(prevUserRef.current, null);
      }

      prevUserRef.current = userRef;

      if (!userRef) {
        return;
      }

      updateRef(userRef, instance);
    },
    [userRef],
  );
};

export default useComposedRef;
