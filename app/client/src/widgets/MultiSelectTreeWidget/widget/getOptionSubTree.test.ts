import { getOptionSubTree } from ".";

describe("getOptionSubTree", () => {
  it(`If parameter mode is "SHOW_PARENT", Just returns the top level matching option`, () => {
    const inputOptions = [
      {
        label: "Blue",
        value: "BLUE",
        children: [
          {
            label: "Dark Blue",
            value: "DARK BLUE",
          },
          {
            label: "Light Blue",
            value: "LIGHT BLUE",
            children: [
              {
                label: "Dark Blues",
                value: "DARK BLUEs",
              },
              {
                label: "Light Blues",
                value: "LIGHT BLUEs",
              },
            ],
          },
        ],
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
    const inputValue = "BLUE";
    const inputMode = "SHOW_PARENT";
    const expected = [{ label: "Blue", value: "BLUE" }];

    const output = getOptionSubTree(inputOptions, inputValue, inputMode);
    expect(output).toEqual(expected);
  });

  it(`If parameter mode is "SHOW_CHILD", Returns only childrens of matching option`, () => {
    const inputOptions = [
      {
        label: "Blue",
        value: "BLUE",
        children: [
          {
            label: "Dark Blue",
            value: "DARK BLUE",
          },
          {
            label: "Light Blue",
            value: "LIGHT BLUE",
            children: [
              {
                label: "Dark Blues",
                value: "DARK BLUEs",
              },
              {
                label: "Light Blues",
                value: "LIGHT BLUEs",
              },
            ],
          },
        ],
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
    const inputValue = "BLUE";
    const inputMode = "SHOW_CHILD";
    const expected = [
      {
        label: "Dark Blue",
        value: "DARK BLUE",
      },
      {
        label: "Dark Blues",
        value: "DARK BLUEs",
      },
      {
        label: "Light Blues",
        value: "LIGHT BLUEs",
      },
    ];

    const output = getOptionSubTree(inputOptions, inputValue, inputMode);
    expect(output).toEqual(expected);
  });

  it(`If parameter mode is "SHOW_ALL", Returns the matching option and its children`, () => {
    const inputOptions = [
      {
        label: "Blue",
        value: "BLUE",
        children: [
          {
            label: "Dark Blue",
            value: "DARK BLUE",
          },
          {
            label: "Light Blue",
            value: "LIGHT BLUE",
            children: [
              {
                label: "Dark Blues",
                value: "DARK BLUEs",
              },
              {
                label: "Light Blues",
                value: "LIGHT BLUEs",
              },
            ],
          },
        ],
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
    const inputValue = "BLUE";
    const inputMode = "SHOW_ALL";
    const expected = [
      {
        label: "Blue",
        value: "BLUE",
      },
      {
        label: "Dark Blue",
        value: "DARK BLUE",
      },
      {
        label: "Light Blue",
        value: "LIGHT BLUE",
      },
      {
        label: "Dark Blues",
        value: "DARK BLUEs",
      },
      {
        label: "Light Blues",
        value: "LIGHT BLUEs",
      },
    ];

    const output = getOptionSubTree(inputOptions, inputValue, inputMode);
    expect(output).toEqual(expected);
  });
});
