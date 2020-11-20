import { isHidden } from "./utils";

describe("isHidden test", () => {
  it("Test for isHidden true", () => {
    const hiddenTrueInputs: any = [
      { values: { name: "Name" }, hidden: true },
      {
        values: { name: "Name" },
        hidden: {
          path: "name",
          value: "Name",
          comparison: "EQUALS",
        },
      },
      {
        values: { name: "Name", config: { type: "EMAIL" } },
        hidden: {
          path: "name.config.type",
          value: "USER_ID",
          comparison: "NOT_EQUALS",
        },
      },
      {
        values: undefined,
        hidden: true,
      },
      {
        values: null,
        hidden: true,
      },
    ];

    hiddenTrueInputs.forEach((input: any) => {
      expect(isHidden(input.values, input.hidden)).toBeTruthy();
    });
  });

  it("Test for isHidden false", () => {
    const hiddenFalseInputs: any = [
      { values: { name: "Name" }, hidden: false },
      {
        values: { name: "Name" },
        hidden: {
          path: "name",
          value: "Different Name",
          comparison: "EQUALS",
        },
      },
      {
        values: { name: "Name", config: { type: "EMAIL" } },
        hidden: {
          path: "config.type",
          value: "EMAIL",
          comparison: "NOT_EQUALS",
        },
      },
      {
        values: undefined,
        hidden: false,
      },
      {
        values: null,
        hidden: false,
      },
      {
        values: undefined,
      },
      {
        values: { name: "Name" },
      },
    ];

    hiddenFalseInputs.forEach((input: any) => {
      expect(isHidden(input.values, input.hidden)).toBeFalsy();
    });
  });
});
