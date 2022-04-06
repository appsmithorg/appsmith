import _ from "lodash";
import RadioGroupWidget from "./index";

describe("unit test case for property config pane", () => {
  it("case: check the value returned by defaultOptionValue", () => {
    const generalSection: any = RadioGroupWidget.getPropertyPaneConfig().filter(
      (section: any) => section.sectionName === "General",
    );

    const dsv = generalSection[0].children.filter(
      (child: any) => child.propertyName === "defaultOptionValue",
    )[0];

    const dsvValidationFunc = dsv.validation.params.fn;

    expect(dsvValidationFunc(1, {}, _)).toEqual({ isValid: true, parsed: 1 });
    expect(dsvValidationFunc("1", {}, _)).toEqual({
      isValid: true,
      parsed: "1",
    });
  });
});
