import { objectKeys } from "./keys";

test("objectKeys should return all the keys in the object map pass to it.", () => {
  const objectMap = { a: 1, b: 2, c: 3 };
  const keys = objectKeys(objectMap);

  expect(keys).toStrictEqual(["a", "b", "c"]);
});
