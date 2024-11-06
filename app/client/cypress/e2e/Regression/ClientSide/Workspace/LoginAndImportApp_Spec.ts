import { REPO, CURRENT_REPO } from "../../../../fixtures/REPO";
import HomePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";
import {
  adminSettings,
  agHelper,
  assertHelper,
  homePage,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Create new workspace and invite user & validate all roles",
  { tags: [""] },
  () => {
    let testData: any;

    // Read the CSV file before running the tests
    before(() => {
      cy.readFile(
        "/Users/sagarkhalasi/codebase/appsmith/app/client/cypress/fixtures/testuserimport.csv",
      ).then((csvData) => {
        const rows = csvData.split("\n"); // Split by newlines to get each row
        const headers = rows[0].split(","); // The first row contains headers
        console.log("Headers:", headers); // Debug headers
        testData = [];
        rows.slice(1).forEach((row) => {
          const values = row.split(",");
          console.log("Row data:", values); // Debug row data
          const userObject: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim() || ""; // Avoid undefined value by providing a default empty string
            userObject[header.trim()] = value;
          });
          testData.push(userObject); // Add user object to the data array
        });
      });
    });

    it("1. Login as and import the app as per file", () => {
      testData.forEach((user) => {
        console.log("JsonFilePath:", user.jsonFilePath); // This should print the string value
        const resolvedJsonFilePath = user.jsonFilePath;
        console.log("Resolved JsonFilePath:", resolvedJsonFilePath); // Log resolved file path
        //homePage.NavigateToHome();
        cy.go(-1)
        agHelper.Sleep(5000);
        cy.SignupFromAPI(
          user.user_email,
          user.password,
        );
        cy.wait(5000);
        cy.go(-1)
        cy.wait(5000);
        cy.reload();
        cy.wait(5000);
        homePage.ImportApp(resolvedJsonFilePath);
        cy.wait(5000);
        cy.LogOut(false);
        cy.wait(5000);
      });
    });
  },
);