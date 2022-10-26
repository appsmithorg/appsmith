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
  },
  {
    script: "ApiNever.data",
    oldName: "ApiNever",
    newName: "ApiForever",
  },
  {
    script:
      "//   ApiNever  \n function ApiNever(abc) {let foo = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
  },
  {
    script:
      "//ApiNever  \n function ApiNever(abc) {let ApiNever = \"I'm getting data from ApiNever but don't rename this string\" +     ApiNever.data; \n if(true) { return ApiNever }}",
    oldName: "ApiNever",
    newName: "ApiForever",
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
      },
      {
        references: ["Api1.data"],
        functionalParams: [],
        variables: ["str"],
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

      await supertest(app)
        .post(`${RTS_BASE_API_PATH}/ast/entity-refactor`, {
          JSON: true,
        })
        .send(input)
        .expect(200)
        .then((response) => {
          expect(response.body.success).toEqual(true);
          expect(response.body.data.script).toEqual(
            expectedResponse[index].script
          );
          expect(response.body.data.count).toEqual(
            expectedResponse[index].count
          );
        });
    });
  });
});
