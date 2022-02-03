import { ConditionFunctions } from "./Constants";
import moment from "moment";

describe("ConditionFunctions Constants", () => {
  it("works as expected for isExactly", () => {
    const conditionFunction = ConditionFunctions["isExactly"];
    expect(conditionFunction("test", "test")).toStrictEqual(true);
  });
  it("works as expected for isExactly", () => {
    const conditionFunction = ConditionFunctions["isExactly"];
    expect(conditionFunction("test", "random")).toStrictEqual(false);
  });
  it("works as expected for empty", () => {
    const conditionFunction = ConditionFunctions["empty"];
    expect(conditionFunction("", "")).toStrictEqual(true);
  });
  it("works as expected for notEmpty", () => {
    const conditionFunction = ConditionFunctions["notEmpty"];
    expect(conditionFunction("test", "")).toStrictEqual(true);
  });
  it("works as expected for notEqualTo", () => {
    const conditionFunction = ConditionFunctions["notEqualTo"];
    expect(conditionFunction("test", "random")).toStrictEqual(true);
  });
  it("works as expected for isEqualTo", () => {
    const conditionFunction = ConditionFunctions["isEqualTo"];
    expect(conditionFunction("test", "test")).toStrictEqual(true);
  });
  it("works as expected for lessThan", () => {
    const conditionFunction = ConditionFunctions["lessThan"];
    expect(conditionFunction(50, 100)).toStrictEqual(true);
  });
  it("works as expected for lessThanEqualTo", () => {
    const conditionFunction = ConditionFunctions["lessThanEqualTo"];
    expect(conditionFunction(50, 50)).toStrictEqual(true);
  });
  it("works as expected for greaterThan", () => {
    const conditionFunction = ConditionFunctions["greaterThan"];
    expect(conditionFunction(100, 50)).toStrictEqual(true);
  });
  it("works as expected for contains", () => {
    const conditionFunction = ConditionFunctions["contains"];
    expect(conditionFunction("random", "and")).toStrictEqual(true);
  });
  it("works as expected for startsWith", () => {
    const conditionFunction = ConditionFunctions["startsWith"];
    expect(conditionFunction("tested", "test")).toStrictEqual(true);
  });
  it("works as expected for endsWith", () => {
    const conditionFunction = ConditionFunctions["endsWith"];
    expect(conditionFunction("subtest", "test")).toStrictEqual(true);
    expect(conditionFunction("subtest", "t")).toStrictEqual(true);
  });
  it("works as expected for is", () => {
    const conditionFunction = ConditionFunctions["is"];
    const date1 = moment();
    expect(conditionFunction(date1, date1)).toStrictEqual(true);
  });
  it("works as expected for isNot", () => {
    const conditionFunction = ConditionFunctions["isNot"];
    const date1 = moment();
    const date2 = moment().add(1, "day");
    expect(conditionFunction(date1, date2)).toStrictEqual(true);
  });
  it("works as expected for isAfter", () => {
    const conditionFunction = ConditionFunctions["isAfter"];
    const date1 = moment();
    const date2 = moment().add(1, "day");
    expect(conditionFunction(date1, date2)).toStrictEqual(true);
  });
  it("works as expected for isBefore", () => {
    const conditionFunction = ConditionFunctions["isBefore"];
    const date1 = moment();
    const date2 = moment().subtract(1, "day");
    expect(conditionFunction(date1, date2)).toStrictEqual(true);
  });
});
