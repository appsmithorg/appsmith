import { buildUrlTextFragment } from "./buildUrlTextFragment";

it("should return an empty array if no fragments are provided", () => {
  expect(buildUrlTextFragment([])).toEqual("");
});

it("should encode special characters", () => {
  expect(buildUrlTextFragment(["text 1 = 2"])).toEqual(
    ":~:text=text%201%20%3D%202",
  );
});

it("should join fragments", () => {
  expect(buildUrlTextFragment(["text 1", "text 2"])).toEqual(
    ":~:text=text%201&text=text%202",
  );
});
