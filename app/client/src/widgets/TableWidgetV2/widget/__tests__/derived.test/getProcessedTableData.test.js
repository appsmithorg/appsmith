import _ from "lodash";
import moment from "moment";
import derivedProperty from "../../derived";

describe("validate getProcessedTableData function", () => {
  const defaultInput = {
    infiniteScrollEnabled: false,
    cachedTableData: {
      1: [
        {
          id: 1,
          name: "John",
        },
        {
          id: 2,
          name: "Ron",
        },
      ],
      2: [
        {
          id: 3,
          name: "Doe",
        },
        {
          id: 4,
          name: "Foo",
        },
      ],
    },
    tableData: [
      {
        id: 3,
        name: "John",
      },
      {
        id: 4,
        name: "Ron",
      },
    ],
    transientTableData: {},
  };

  it("should return the tableData as the processData when infiniteScrollEnabled is false", () => {
    const { getProcessedTableData } = derivedProperty;
    const processedData = getProcessedTableData(defaultInput, moment, _);

    expect(processedData.map((i) => i.id)).toStrictEqual([3, 4]);
  });

  it("should return the cachedTableData as the processData when infiniteScrollEnabled is true", () => {
    const { getProcessedTableData } = derivedProperty;
    const processedData = getProcessedTableData(
      {
        ...defaultInput,
        infiniteScrollEnabled: true,
      },
      moment,
      _,
    );

    expect(processedData.map((i) => i.id)).toStrictEqual([1, 2, 3, 4]);
  });
});
