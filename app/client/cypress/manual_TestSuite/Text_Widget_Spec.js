const homePage = require("../../../locators/Textwidget.json");

describe("Test Ideas to test different feature of text widget ", function() {
  it("Add New Text widget along with BG and text colour ", function() {
    // Navigate to application
    // Drag and drop a Text Widget
    // Navigate to Property Pane
    // Add a text
    // Scroll to BG colour and add a colour
    // Next add a text colour
    // Click on Deploy
  });

  it("Enable Scroll feature with text colour ", function() {
    // Navigate to application
    // Drag and drop a Text Widget
    // Add a long text in the "Label"
    // Enable scroll option
    // Navigate to Text colour and add a colour
    // and ensure it is scrolling
    // Click on deploy and check if it scrollable and colour selected is visible
  });

  it("Adding text Size to the Text along with BG colour ", function() {
    // Navigate to application
    // Drag and drop a Text Widget
    // Navigate to Property pane
    // Add a medium text in the "Label"
    // Increase the area of the Text Widget
    // Navigate to BG colour and add a colour
    // Naviaget to "Text Size"
    // Select Paragarph option
    // Ensure the text size varies accordingly
  });

  it("Adding Bold Font style and Centre Text Alignment  ", function() {
    // Navigate to application
    // Drag and drop a Text Widget
    // Navigate to Property pane
    // Add a medium text in the "Label"
    // Increase the area of the Text Widget
    // Navigate to Font Style
    // Make it Bold
    // and Navigate to Alignment and make it centre
    // Ensure the changes are visible to user
  });

  it("Adding Italic Font style and Text Alignment to exsisting text widget ", function() {
    // Navigate to already exsisting Text widget
    // Ensure the text is added
    // Navigate to Property pane
    // Navigate to Font Style
    // Make it Italic font
    // and Navigate to Alignment and make it Right
    // Ensure the changes are visible to user
  });

  it("Expand and Contract text widget Property pane", function() {
    // Navigate to already exsisting Text widget
    // Navigate to Property pane
    // Click on collapse option
    // Observe that the property  pane is contracted
    // Now click again on the arrow
    //and ensure it collapses
  });

  it("Copy and paste a text widget", function() {
    // Navigate to already exsisting Text widget
    // Ensure Clour and font feature exsists
    // Copy and paste the widget
    // Ensure the new widget retrives the feature exsisting from parent widget
  });

  it("Rename and search a text widget", function() {
    // Ensure there are multiple Text widget
    // Navigate to Entity Explorer
    // Search for "Text" keyword
    // Click on one of the text widget
    // Rename the text widget from the Entity explorer
    // Clear the search keyword
    // enter the new text widget name
    // and observe the user is navigated to same text widget and properties of the widget does not change on renaming
  });

  it("Search and delete a text widget", function() {
    // Ensure there are multiple Text widget
    // Navigate to Entity Explorer
    // Search for "Text" keyword
    // Click on one of the text widget
    // Ensure user is navigated to Text widget
    // Click on Delete option
    // Ensure the Text widget is delete
    // Click on Deploy adn ensure the Widget is delete
  });

  it("Search and delete a text widget", function() {
    // Ensure there are multiple Text widget
    // Navigate to Entity Explorer
    // Search for "Text" keyword
    // Click on one of the text widget
    // Ensure user is navigated to Text widget
    // Click on Delete option
    // Ensure the Text widget is delete
    // Click on Deploy adn ensure the Widget is delete
  });
});
