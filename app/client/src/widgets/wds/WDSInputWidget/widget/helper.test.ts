import { InputTypes } from "widgets/BaseInputWidget/constants";
import { parseText } from "./helper";

describe("getParsedText", () => {
  it("should test with all possible values", () => {
    let text;

    text = parseText("test", InputTypes.TEXT);
    expect(text).toBe("test");

    text = parseText("test1", InputTypes.PASSWORD);
    expect(text).toBe("test1");

    text = parseText("test@appsmith.com", InputTypes.EMAIL);
    expect(text).toBe("test@appsmith.com");

    text = parseText("", InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(undefined as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(null as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(null);

    text = parseText(1 as unknown as string, InputTypes.NUMBER);
    expect(text).toBe(1);

    text = parseText("1.01", InputTypes.NUMBER);
    expect(text).toBe(1.01);

    text = parseText("1.00", InputTypes.NUMBER);
    expect(text).toBe(1);
  });
});
