import { cloneDeep, noop } from "lodash";
import type { DSLWidget } from "widgets/constants";
import { traverseDSLAndMigrate } from "./WidgetMigrationUtils";

const dsl = {
  children: [
    {
      name: "widget1",
      children: [
        {
          name: "widget2",
        },
        {
          name: "widget3",
        },
      ],
    },
    {
      name: "widget4",
    },
  ],
};

describe("traverseDSLAndMigrate", () => {
  it("should check that migration function is getting called for each widget in the tree", () => {
    const migrateFn = jest.fn();
    traverseDSLAndMigrate(dsl as any as DSLWidget, migrateFn);
    expect(migrateFn).toHaveBeenCalledTimes(4);
  });

  it("should check that tree structure remain intact", () => {
    const copyDSL = cloneDeep(dsl);
    traverseDSLAndMigrate(dsl as any as DSLWidget, noop);
    expect(dsl).toEqual(copyDSL);
  });

  it("should check that migration function updates are written in the tree", () => {
    traverseDSLAndMigrate(dsl as any as DSLWidget, (widget) => {
      widget.type = "widget";
    });

    expect(dsl).toEqual({
      children: [
        {
          name: "widget1",
          type: "widget",
          children: [
            {
              name: "widget2",
              type: "widget",
            },
            {
              name: "widget3",
              type: "widget",
            },
          ],
        },
        {
          name: "widget4",
          type: "widget",
        },
      ],
    });
  });
});
