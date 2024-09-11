import TableWidget from "./index";

describe("unit test case for property config pane", () => {
  it("case: check tooltip text for total record count property exists", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generalSection: any = TableWidget.getPropertyPaneConfig().filter(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (section: any) => section.sectionName === "General",
    );

    const totalRecordsCount = generalSection[0].children.filter(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.propertyName === "totalRecordsCount",
    )[0];

    expect(totalRecordsCount.helpText).toEqual(
      "It stores the total no. of rows in the table. Helps in calculating the no. of pages that further allows to enable or disable the next/previous control in pagination.",
    );
  });
});
