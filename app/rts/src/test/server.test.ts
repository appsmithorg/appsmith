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

describe("AST", () => {
  it("Testing to see if Jest works", async () => {
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
        console.log(response.body);
        // Check type and length
        expect(response.body.success).toEqual(true);
        expect(response.body.data).toEqual(expectedResponse);
      });
  });

  it("Testing to see if Jest workss", async () => {
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
        console.log(response.body);
        // Check type and length
        expect(response.body.success).toEqual(true);
        expect(response.body.data.length).toBeGreaterThan(1);
        expect(response.body.data).toEqual(expectedResponse);
      });
  });
});
