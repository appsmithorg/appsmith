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

    expect(dsvValidationFunc(1)).toEqual({ isValid: true, parsed: 1 });
    expect(dsvValidationFunc("1")).toEqual({ isValid: true, parsed: "1" });
  });

  // it("case: check the value returned by options property", () => {
  //   const generalSection: any = RadioGroupWidget.getPropertyPaneConfig().filter(
  //     (section: any) => section.sectionName === "General",
  //   );

  //   const options = generalSection[0].children.filter(
  //     (child: any) => child.propertyName === "options",
  //   )[0];

  //   const customOptionsValidationFunc = options.validation.params.fn;

  //   expect(
  //     customOptionsValidationFunc(`[
  //     {
  //       "label": "Yes",
  //       "value": "1"
  //     },
  //     {
  //       "label": "No",
  //       "value": 2
  //     }
  //   ]`),
  //   ).toEqual({
  //     isValid: false,
  //     messages: ["All values in options must have the same type"],
  //     parsed: [],
  //   });
  // });
});
