import { homePage } from "../../../../support/Objects/ObjectsCore";

describe(
  "CSRF logout and login",
  { tags: ["@tag.Sanity", "@tag.Authentication"] },
  () => {
    it("1. Login and logout", () => {
      homePage.LogintoApp(
        Cypress.env("USERNAME"),
        Cypress.env("PASSWORD"),
        "App Viewer",
      );
      homePage.LogOutviaAPI();
    });

    it("2. Login again as another user", () => {
      homePage.LogintoApp(
        Cypress.env("TESTUSERNAME1"),
        Cypress.env("TESTPASSWORD1"),
        "App Viewer",
      );
    });
  },
);
