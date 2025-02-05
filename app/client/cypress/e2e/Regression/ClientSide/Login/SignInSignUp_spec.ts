import { agHelper, homePage } from "../../../../support/Objects/ObjectsCore";
import SignupPageLocators from "../../../../locators/SignupPage.json";
import loginPage from "../../../../locators/LoginPage.json";
import welcomePage from "../../../../locators/welcomePage.json";

const emailOne = `sagarspecSignIn1.${Math.random().toString(36).substring(2, 25)}@appsmith.com`;
const tempPassword = "testPassword";

describe("Sign in and Sign up verification", { tags: ["@tag.Visual"] }, () => {
  it("1. User can sign up to application with form.", () => {
    homePage.LogOutviaAPI();
    agHelper.VisitNAssert("/");
    agHelper.WaitUntilEleAppear(SignupPageLocators.forgetPasswordLink);
    agHelper.AssertElementExist(SignupPageLocators.signupLink);
    agHelper.GetNClick(SignupPageLocators.signupLink);
    agHelper.AssertURL("/user/signup");
    cy.get(loginPage.username).type(emailOne);
    cy.get(loginPage.password).type(tempPassword, { log: false });
    cy.get(loginPage.submitBtn).click();
    cy.wait("@getConsolidatedData");
    agHelper.AssertURL("/signup-success?");
    agHelper.AssertContains("Brand New");
    agHelper.GetNClick(welcomePage.proficiencyGroupButton, 0);
    agHelper.GetNClick(welcomePage.useCaseGroupButton, 0);
    agHelper.ClickButton("Get started");
  });

  it("2. User can sign in to application with form.", () => {
    homePage.LogOutviaAPI();
    cy.LoginFromAPI(emailOne, tempPassword);
  });
});
