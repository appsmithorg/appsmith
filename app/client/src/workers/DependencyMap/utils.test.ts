import { entityRefactorFromCode } from "@shared/ast";

const entityRefactor = [
  {
    script: "ApiNever",
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  },
  {
    script: "ApiNever.data",
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  },
  {
    script:
      "//ApiNever  \n function ApiNever(abc) {let ApiNever = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  },
];
const expectedResponse = [
  { script: "ApiForever", count: 1 },
  { script: "ApiForever.data", count: 1 },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiForever.data; \n if(true) { return ApiForever }}",
    count: 2,
  },
  {
    script:
      "//ApiNever  \n function ApiNever(abc) {let ApiNever = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    count: 0,
  },
];

describe("Check if shared/ast module is loaded", () => {
  const input = {
    script: '"ApiNever"+ ApiNever.data',
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  };

  type EntityRefactorReturnType = {
    script: string;
    count: number;
  };

  entityRefactor.forEach(async (input, index) => {
    it(`Entity refactor test case ${index + 1}`, async () => {
      const res = entityRefactorFromCode(
        input.script,
        input.oldName,
        input.newName,
        input.evalVersion,
      ) as EntityRefactorReturnType;
      expect(res.script).toEqual(expectedResponse[index].script);
      expect(res.count).toEqual(expectedResponse[index].count);
    });
  });
});
