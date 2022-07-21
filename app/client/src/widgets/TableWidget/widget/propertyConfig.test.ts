import TableWidget from "./index";

describe("unit test case for property config pane", () => {
  it("case: check tooltip text for total record count property exists", () => {
    const generalSection: any = TableWidget.getPropertyPaneConfig().filter(
      (section: any) => section.sectionName === "General",
    );

    const totalRecordsCount = generalSection[0].children.filter(
      (child: any) => child.propertyName === "totalRecordsCount",
    )[0];

    expect(totalRecordsCount.helpText).toEqual(
      "It stores the total no. of rows in the table. Helps in calculating the no. of pages that further allows to enable or disable the next/previous control in pagination.",
    );
  });
});
