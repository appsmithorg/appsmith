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
});
