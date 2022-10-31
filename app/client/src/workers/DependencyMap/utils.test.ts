import { entityRefactorFromCode } from "@shared/ast";

const entityRefactor = [
  {
    script: "ApiNever",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script: "ApiNever.data",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script:
      "//ApiNever  \n function ApiNever(abc) {let ApiNever = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script:
      "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\t\tsearch: () => {\n\t\tif(Input1Copy.text.length==0){\n\t\t\treturn select_repair_db.data\n\t\t}\n\t\telse{\n\t\t\treturn(select_repair_db.data.filter(word => word.cust_name.toLowerCase().includes(Input1Copy.text.toLowerCase())))\n\t\t}\n\t},\n}",
    oldName: "Input1Copy",
    newName: "Input1",
    isJSObject: true,
    evalVersion: 2,
  },
];
const expectedResponse = [
  { script: "ApiForever", refactorCount: 1 },
  { script: "ApiForever.data", refactorCount: 1 },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiForever.data; \n if(true) { return ApiForever }}",
    refactorCount: 2,
  },
  {
    script:
      "//ApiNever  \n function ApiNever(abc) {let ApiNever = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    refactorCount: 0,
  },
  {
    script:
      "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\t\tsearch: () => {\n\t\tif(Input1.text.length==0){\n\t\t\treturn select_repair_db.data\n\t\t}\n\t\telse{\n\t\t\treturn(select_repair_db.data.filter(word => word.cust_name.toLowerCase().includes(Input1.text.toLowerCase())))\n\t\t}\n\t},\n}",
    refactorCount: 2,
  },
];

type EntityRefactorResponse = {
  isSuccess: boolean;
  body: { script: string; refactorCount: number };
};

describe("Check if shared/ast module is loaded", () => {
  const input = {
    script: '"ApiNever"+ ApiNever.data',
    oldName: "ApiNever",
    newName: "ApiForever",
    evalVersion: 2,
  };

  //These are integration test to verify the loading of @shared/ast module.
  entityRefactor.forEach(async (input, index) => {
    it(`Entity refactor test case ${index + 1}`, async () => {
      const res = entityRefactorFromCode(
        input.script,
        input.oldName,
        input.newName,
        input.isJSObject,
        input.evalVersion,
      ) as EntityRefactorResponse;
      expect(res.body.script).toEqual(expectedResponse[index].script);
      expect(res.body.refactorCount).toEqual(
        expectedResponse[index].refactorCount,
      );
    });
  });
});
