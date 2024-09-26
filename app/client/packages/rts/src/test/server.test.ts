import app, { RTS_BASE_API_PATH } from "../server";
import supertest from "supertest";

const singleScript = {
  script:
    "(function abc() { let Api2 = { }; return Api2.data ? str.data + Api1.data : [] })()",
};

const multipleScripts = {
  scripts: [
    "(function abc() { return Api1.data })() ",
    "(function abc() { let str = ''; return str ? Api1.data : [] })()",
  ],
};

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
  },
  {
    script:
      "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\t\tsearch: () => {\n\t\tif(Input1Copy.text.length==0){\n\t\t\treturn select_repair_db.data\n\t\t}\n\t\telse{\n\t\t\treturn(select_repair_db.data.filter(word => word.cust_name.toLowerCase().includes(Input1Copy.text.toLowerCase())))\n\t\t}\n\t},\n}",
    oldName: "Input1Copy",
    newName: "Input1",
    isJSObject: true,
    evalVersion: 2,
  },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever.data",
    newName: "ApiNever.input",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever.dat",
    newName: "ApiNever.input",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script: "\tApiNever.data",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script: "ApiNever.data + ApiNever.data",
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
  {
    script:
      'export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t// ApiNever.text\n\t\treturn "ApiNever.text" + ApiNever.text\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t\t// ApiNever.text\n\t\treturn "ApiNever.text" + ApiNever.text\n\t}\n}',
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: true,
    evalVersion: 2,
  },
  {
    script:
      '(function(){\n        try{\n        ApiNever.run(); \n                showAlert("Sucessful Trigger");\n   }catch(error){\nshowAlert("Unsucessful Trigger");\n   }\n})()',
    oldName: "ApiNever",
    newName: "ApiForever",
    isJSObject: false,
    evalVersion: 2,
  },
];

afterAll((done) => {
  app.close();
  done();
});

describe("AST tests", () => {
  it("Checks to see if single script is parsed correctly using the API", async () => {
    const expectedResponse = {
      references: ["str.data", "Api1.data"],
      functionalParams: [],
      variables: ["Api2"],
      isError: false,
    };

    await supertest(app)
      .post(`${RTS_BASE_API_PATH}/ast/single-script-data`, {
        JSON: true,
      })
      .send(singleScript)
      .expect(200)
      .then((response) => {
        expect(response.body.success).toEqual(true);
        expect(response.body.data).toEqual(expectedResponse);
      });
  });

  it("Checks to see if multiple scripts are parsed correctly using the API", async () => {
    const expectedResponse = [
      {
        references: ["Api1.data"],
        functionalParams: [],
        variables: [],
        isError: false,
      },
      {
        references: ["Api1.data"],
        functionalParams: [],
        variables: ["str"],
        isError: false,
      },
    ];

    await supertest(app)
      .post(`${RTS_BASE_API_PATH}/ast/multiple-script-data`, {
        JSON: true,
      })
      .send(multipleScripts)
      .expect(200)
      .then((response) => {
        expect(response.body.success).toEqual(true);
        expect(response.body.data.length).toBeGreaterThan(1);
        expect(response.body.data).toEqual(expectedResponse);
      });
  });

  entityRefactor.forEach(async (input, index) => {
    it(`Entity refactor test case ${index + 1}`, async () => {
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
        {
          script:
            "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.input; \n if(true) { return ApiNever }}",
          refactorCount: 1,
        },
        {
          script:
            "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
          refactorCount: 0,
        },
        {
          script: "\tApiForever.data",
          refactorCount: 1,
        },
        {
          script: "ApiForever.data + ApiForever.data",
          refactorCount: 2,
        },
        {
          script:
            'export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t\t// ApiNever.text\n\t\treturn "ApiNever.text" + ApiForever.text\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t\t// ApiNever.text\n\t\treturn "ApiNever.text" + ApiForever.text\n\t}\n}',
          refactorCount: 2,
        },
        {
          script:
            '(function(){\n        try{\n        ApiForever.run(); \n                showAlert("Sucessful Trigger");\n   }catch(error){\nshowAlert("Unsucessful Trigger");\n   }\n})()',
          refactorCount: 1,
        },
      ];

      await supertest(app)
        .post(`${RTS_BASE_API_PATH}/ast/entity-refactor`, {
          JSON: true,
        })
        .send(input)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toEqual(true);
          expect(response.body.data.script).toEqual(
            expectedResponse[index].script,
          );
          expect(response.body.data.refactorCount).toEqual(
            expectedResponse[index].refactorCount,
          );
        });
    });
  });

  it("Entity refactor syntax error", async () => {
    const request = {
      script: "ApiNever++++",
      oldName: "ApiNever",
      newName: "ApiForever",
      isJSObject: true,
      evalVersion: 2,
    };

    await supertest(app)
      .post(`${RTS_BASE_API_PATH}/ast/entity-refactor`, {
        JSON: true,
      })
      .send(request)
      .expect(200)
      .then((response) => {
        expect(response.body.success).toEqual(false);
        expect(response.body.data.error).toEqual("Syntax Error");
      });
  });
});
