import { InputTypes } from "widgets/BaseInputWidget/constants";
import { getParsedText } from "./Utilities";

describe("getParsedText", () => {
  it("should test with all possible values", () => {
    let text = getParsedText("test", InputTypes.TEXT);

    expect(text).toBe("test");

    text = getParsedText("test1", InputTypes.PASSWORD);

    expect(text).toBe("test1");

    text = getParsedText("test@appsmith.com", InputTypes.EMAIL);

    expect(text).toBe("test@appsmith.com");

    text = getParsedText("", InputTypes.NUMBER);

    expect(text).toBe(null);

    text = getParsedText((undefined as unknown) as string, InputTypes.NUMBER);

    expect(text).toBe(null);

    text = getParsedText((null as unknown) as string, InputTypes.NUMBER);

    expect(text).toBe(null);

    text = getParsedText((1 as unknown) as string, InputTypes.NUMBER);

    expect(text).toBe(1);

    text = getParsedText("1.01", InputTypes.NUMBER);

    expect(text).toBe(1.01);

    text = getParsedText("1.00", InputTypes.NUMBER);

    expect(text).toBe(1);
  });
});
