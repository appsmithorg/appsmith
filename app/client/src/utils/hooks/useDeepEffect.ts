import equal from "fast-deep-equal/es6";
import { DependencyList, EffectCallback, useEffect, useRef } from "react";

const STARTS_WITH_PRIMITIVE_REGEX = /^[sbn]/;

function isPrimitive(val: unknown) {
  return val === null || STARTS_WITH_PRIMITIVE_REGEX.test(typeof val);
}

function checkDeps(deps?: DependencyList) {
  if (!deps || !deps.length) {
    throw new Error(
      "useDeepEffect should not be used with no dependencies. Use React.useEffect instead.",
    );
  }

  if (deps.every(isPrimitive)) {
    throw new Error(
      "useDeepEffect should not be used with dependencies that are all primitive values. Use React.useEffect instead.",
    );
  }
}

function useDeepEffect(effectFn: EffectCallback, deps?: DependencyList) {
  const depsRef = useRef(deps);
  const signalRef = useRef<number>(0);

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    checkDeps(deps);
  }

  if (!equal(deps, depsRef.current)) {
    depsRef.current = deps;
    signalRef.current += 1;
  }

  return useEffect(effectFn, [signalRef.current]);
}

export default useDeepEffect;
