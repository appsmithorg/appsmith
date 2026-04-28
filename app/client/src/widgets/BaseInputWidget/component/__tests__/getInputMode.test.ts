import { InputMode } from "../../constants";
import { getInputMode } from "../index";

describe("getInputMode", () => {
  it('maps NUMBER to InputMode.DECIMAL ("decimal")', () => {
    expect(getInputMode("NUMBER")).toBe(InputMode.DECIMAL);
  });

  it('maps TEL to InputMode.TEL ("tel")', () => {
    expect(getInputMode("TEL")).toBe(InputMode.TEL);
  });

  it('maps EMAIL to InputMode.EMAIL ("email")', () => {
    expect(getInputMode("EMAIL")).toBe(InputMode.EMAIL);
  });

  it("returns undefined for default/unknown type", () => {
    expect(getInputMode("TEXT")).toBeUndefined();
  });
});