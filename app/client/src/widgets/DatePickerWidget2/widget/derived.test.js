import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

describe("Validates Derived Properties", () => {
  it("selectedDate is between min and max dates", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2021-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(true);
  });

  it("selectedDate is out of bounds", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2021-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2022-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(false);
  });

  it("isRequired is enabled and date is not selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: true,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(false);
  });

  it("isRequired is disabled and date is selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2021-12-01T05:49:24.753Z",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(true);
  });

  it("isRequired is disabled and date is not selected", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(true);
  });

  it("isRequired is disabled and date is not between min and max", () => {
    const { isValidDate } = derivedProperty;
    const input = {
      isRequired: false,
      maxDate: "2121-12-31T18:29:00.000Z",
      minDate: "1920-12-31T18:30:00.000Z",
      selectedDate: "2122-12-31T18:29:00.000Z",
    };

    let result = isValidDate(input, moment, _);

    expect(result).toStrictEqual(false);
  });
  describe("timePrecision", () => {
    it("should fail when selectedDate minute is outside bounds", () => {
      const { isValidDate } = derivedProperty;
      const input = {
        isRequired: true,
        maxDate: "2021-12-01T05:49:00.000Z",
        minDate: "2021-12-01T05:48:00.000Z",
        selectedDate: "2021-12-01T05:50:00.000Z",
        timePrecision: "minute",
      };

      let result = isValidDate(input, moment, _);

      expect(result).toStrictEqual(false);
    });

    it("timePrecision: minute -> date is valid even if selectedDate is over by seconds", () => {
      const { isValidDate } = derivedProperty;
      const input = {
        isRequired: true,
        maxDate: "2121-12-31T18:29:00.000Z",
        minDate: "2021-12-01T05:49:28.753Z",
        selectedDate: "2021-12-01T05:49:24.753Z",
        timePrecision: "minute",
      };

      let result = isValidDate(input, moment, _);

      expect(result).toStrictEqual(true);
    });

    it("timePrecision: second -> date is valid even if selectedDate is over by milliseconds", () => {
      const { isValidDate } = derivedProperty;
      const input = {
        isRequired: true,
        maxDate: "2121-12-31T18:29:00.000Z",
        minDate: "2021-12-01T05:49:24.753Z",
        selectedDate: "2021-12-01T05:49:24.751Z",
        timePrecision: "second",
      };

      let result = isValidDate(input, moment, _);

      expect(result).toStrictEqual(true);
    });

    it("timePrecision: millisecond", () => {
      const { isValidDate } = derivedProperty;
      const input = {
        isRequired: true,
        maxDate: "2121-12-31T18:29:00.000Z",
        minDate: "2021-12-01T05:49:24.752Z",
        selectedDate: "2021-12-01T05:49:24.753Z",
        timePrecision: "millisecond",
      };

      let result = isValidDate(input, moment, _);

      expect(result).toStrictEqual(true);
    });

    describe("timePrecision: None", () => {
      it("date is same as minDate", () => {
        const { isValidDate } = derivedProperty;
        const input = {
          isRequired: true,
          maxDate: "2121-12-31T18:29:00.000Z",
          minDate: "2021-12-01T00:00:00.000Z",
          selectedDate: "2021-12-01T00:00:00.000Z",
          timePrecision: "None",
        };

        let result = isValidDate(input, moment, _);

        expect(result).toStrictEqual(true);
      });
      it("date is same as maxDate", () => {
        const { isValidDate } = derivedProperty;
        const input = {
          isRequired: true,
          maxDate: "2021-12-01T00:00:00.000Z",
          minDate: "1991-12-31T18:29:00.000Z",
          selectedDate: "2021-12-01T00:00:00.000Z",
          timePrecision: "None",
        };

        let result = isValidDate(input, moment, _);

        expect(result).toStrictEqual(true);
      });
      it("date is between minDate and maxDate", () => {
        const { isValidDate } = derivedProperty;
        const input = {
          isRequired: true,
          maxDate: "2121-12-31T18:29:00.000Z",
          minDate: "1920-12-31T18:30:00.000Z",
          selectedDate: "2021-12-01T05:49:24.753Z",
          timePrecision: "None",
        };

        let result = isValidDate(input, moment, _);

        expect(result).toStrictEqual(true);
      });
      it("date is out of bounds", () => {
        const { isValidDate } = derivedProperty;
        const input = {
          isRequired: true,
          maxDate: "2021-12-31T18:29:00.000Z",
          minDate: "1920-12-31T18:30:00.000Z",
          selectedDate: "2022-12-01T05:49:24.753Z",
          timePrecision: "None",
        };

        let result = isValidDate(input, moment, _);

        expect(result).toStrictEqual(false);
      });
    });
  });
});
