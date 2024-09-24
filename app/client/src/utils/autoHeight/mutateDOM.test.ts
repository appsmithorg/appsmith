import { getNodesAndStylesToUpdate } from "./mutateDOM";
describe("DOM mutations", () => {
  it("Computes the correct values to update based on widgetsToUpdate", () => {
    const widgetsToUpdate = {
      m: [
        {
          propertyValue: 100,
          propertyPath: "bottomRow",
        },
        {
          propertyValue: 10,
          propertyPath: "topRow",
        },
      ],
      n: [
        {
          propertyValue: 100,
          propertyPath: "bottomRow",
        },
      ],
      o: [
        {
          propertyValue: 100,
          propertyPath: "bottomRow",
        },
        {
          propertyValue: 0,
          propertyPath: "topRow",
        },
      ],
    };
    const widgetsMeasuredInPixels = ["n", "o"];
    const result = getNodesAndStylesToUpdate(
      widgetsToUpdate,
      widgetsMeasuredInPixels,
    );

    expect(result).toStrictEqual({
      m: { y: 106, height: 900 },
      n: { y: 6, height: 100 }, // Since we're absolutely positioning the canvas widges, this y value is correct
      o: { y: 6, height: 100 },
    });
  });
});
