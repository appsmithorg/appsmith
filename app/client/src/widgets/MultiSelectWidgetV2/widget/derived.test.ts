import _ from "lodash";
import derived from "./derived";

const options = [
  {
    label: "Blue",
    value: "BLUE",
  },
  {
    label: "Green",
    value: "GREEN",
  },
  {
    label: "Red",
    value: "RED",
  },
];

describe("Derived properties", () => {
  describe("selectedOptionLabels", () => {
    describe("selectedOptions is RawValueType[]", () => {
      it("serverSideFiltering is true, returns labels from selectedOptions", () => {
        expect(
          derived.selectedOptionLabels(
            { options, selectedOptions: ["YELLOW"], serverSideFiltering: true },
            null,
            _,
          ),
        ).toEqual(["YELLOW"]);
      });
      it("serverSideFiltering is false, returns only values in options", () => {
        expect(
          derived.selectedOptionLabels(
            {
              options,
              selectedOptions: ["BLUE", "YELLOW"],
              selectedOptionValues: ["BLUE", "YELLOW"],
              serverSideFiltering: false,
            },
            null,
            _,
          ),
        ).toEqual(["BLUE"]);
      });
    });
    describe("selectedOptions is LabelValueType[]", () => {
      it("serverSideFiltering is true, returns labels from selectedOptions", () => {
        expect(
          derived.selectedOptionLabels(
            {
              options,
              selectedOptions: [{ label: "yellow", value: "YELLOW" }],
              serverSideFiltering: true,
            },
            null,
            _,
          ),
        ).toEqual(["yellow"]);
      });
      it("serverSideFiltering is false, returns only values in options", () => {
        expect(
          derived.selectedOptionLabels(
            {
              options,
              selectedOptions: [
                { label: "blue", value: "BLUE" },
                { label: "yellow", value: "YELLOW" },
              ],
              selectedOptionValues: ["BLUE", "YELLOW"],
              serverSideFiltering: false,
            },
            null,
            _,
          ),
        ).toEqual(["BLUE"]);
      });
    });
  });

  describe("selectedOptionValues", () => {
    describe("selectedOptions is RawValueType[]", () => {
      it("serverSideFiltering is true, returns values from selectedOptions", () => {
        expect(
          derived.selectedOptionValues(
            { options, selectedOptions: ["YELLOW"], serverSideFiltering: true },
            null,
            _,
          ),
        ).toEqual(["YELLOW"]);
      });
      it("serverSideFiltering is false, returns only values in options", () => {
        expect(
          derived.selectedOptionValues(
            {
              options,
              selectedOptions: ["BLUE", "YELLOW"],
              serverSideFiltering: false,
            },
            null,
            _,
          ),
        ).toEqual(["BLUE"]);
      });
    });
    describe("selectedOptions is LabelValueType[]", () => {
      it("serverSideFiltering is true, returns values from selectedOptions", () => {
        expect(
          derived.selectedOptionValues(
            {
              options,
              selectedOptions: [{ label: "yellow", value: "YELLOW" }],
              serverSideFiltering: true,
            },
            null,
            _,
          ),
        ).toEqual(["YELLOW"]);
      });
      it("serverSideFiltering is false, returns only values in options", () => {
        expect(
          derived.selectedOptionValues(
            {
              options,
              selectedOptions: [
                { label: "blue", value: "BLUE" },
                { label: "yellow", value: "YELLOW" },
              ],
              serverSideFiltering: false,
            },
            null,
            _,
          ),
        ).toEqual(["BLUE"]);
      });
    });
  });
});
