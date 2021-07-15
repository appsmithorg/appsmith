import { defaultMemoize } from "reselect";
import shallowequal from "shallowequal";

function customShallowEqual<T>(a: T, b: T): boolean {
  return shallowequal(a, b);
}

export const createMemoizedArrayResult = () => {
  const memArray = defaultMemoize(
    (...array: any[]) => array,
    customShallowEqual,
  );
  //eslint-disable-next-line
  return (array: any[]) => memArray.apply(null, array);
};
