const onboarding = require("../../../locators/Onboarding.json");
const explorer = require("../../../locators/explorerlocators.json");
import homePage from "../../../locators/HomePage";
const loginPage = require("../../../locators/LoginPage.json");

describe("Onboarding flow", function() {
  it("Onboarding using Google Id ", function() {
    // Navigate to Login Page
    // Click on "Sign In with Google"
    // Ensure user is navigated to Google Account
    // Do select the Google Id
    // Ensure user is navigated into the Appsmith
    // Click on the icon on the right with single letter (Profile)
    // Check the Email Id
    // Click on Logout
  });

  it("Onboarding using Github ID ", function() {
    // Navigate to Login Page
    // Click on "Sign In with Github"
    // Ensure user is navigated to Github Account
    // Do select the Github Id
    // Ensure user is navigated into the Appsmith
    // Click on the icon on the right with single letter (Profile)
    // Check the Email Id
    // Click on Logout
  });
});
