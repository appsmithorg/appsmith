import _ from "lodash";
import RadioGroupWidget from "./index";

describe("unit test case for property config pane", () => {
  it("case: check the value returned by defaultOptionValue", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataSection: any =
      RadioGroupWidget.getPropertyPaneContentConfig().filter(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (section: any) => section.sectionName === "Data",
      );

    const dsv = dataSection[0].children.filter(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
