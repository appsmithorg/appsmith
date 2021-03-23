import { pageNoValidator } from "./validators";
import WidgetPayloads from "mockComponentProps/WidgetPayloads";
describe("Validates functions in the table widget", () => {
  it("validates page no", () => {
    const input = [0, -1, undefined, null, 2, "abcd", [], ""];
    const expected = [1, 1, 1, 1, 2, 1, 1, 1];
    input.forEach((val, index) => {
      const result = pageNoValidator(
        val,
        WidgetPayloads.dummyWidgetProps,
        undefined,
      );
      const expectedResult: {
        isValid: boolean;
        parsed: number;
        message?: string;
      } = {
        isValid: expected[index] !== 1,
        parsed: expected[index],
      };
      if (expected[index] === 1) {
        expectedResult.message = "";
      }
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
