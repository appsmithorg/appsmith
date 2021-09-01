const dsl = require("../../../fixtures/profileDsl.json");

describe("Page functionality ", function() {
  it("Profile Page", function() {
    // Click on Name
    // Navigate to "Edit Profile"
    // Ensure Display name and Email Id are displayed to user
    // Ensure Reset password link is disaplyed to user
  });

  it("Edit Display Name", function() {
    // Click on Name
    // Navigate to "Edit Profile"
    // Ensure Display name is editable
    // Click on the Field
    // Edit the name of the field
    // Ensure the name of the is displayed in the droped
  });

  it("Edit Display Name", function() {
    // Click on Name
    // Navigate to "Edit Profile"
    // Ensure the "Reset Password" link is dispalyed to user
    // Click on "Reset Password" link
    // User must be navigated to Sign up page
    // An link must be sent to User EmailId
  });
});
