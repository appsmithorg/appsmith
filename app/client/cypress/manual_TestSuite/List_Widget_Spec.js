const dsl = require("../../../fixtures/ListWidgetDsl.json");

describe("List Widget test ideas ", function() {
  it("List widget background colour and deploy ", function() {
    // Drag and drop a List widget
    // Open Property pane
    // Scroll down to Styles
    // Add background colour
    // Add item background colour
    // Ensure the colour are added appropriately
    // Click on Deploy and ensure it is deployed appropriately
  });

  it("Adding large item Spacing for item card", function() {
    // Drag and drop a List widget
    // Open Property pane
    // Scroll down to Styles
    // Add large item spacing (>100)
    // Ensure the cards get spaced appropriately
  });

  it("Binding an API data to list widget ", function() {
    //Add an API
    // Drag and drop a List widget
    // Open list Property pane
    // Bind the API to list widget
    // Add Input widget into the list widget
    // Bind the input widgte to the list widget
  });

  it("Copy Paste and Delete the List Widget ", function() {
    // Drag and drop a List widget
    // Click on the property pane
    // Click on Copy the widget
    // Paste(cmd+v) the list widget
    // Click on the delete option of the Parent widget
  });

  it("Renaming the widget from Property pane and Entity explorer ", function() {
    // Drag and drop a List widget
    // Click on the property pane
    // Click name of the widget
    // Rename the widget
    // Navigate to the Entity Explorer
    // Click on the Widget expands
    // Navigate to List widget (Double Click)
    // Rename the widget
    // Ensure the name of the widget is possible from both the place
  });

  it("Verify the Pagination functionlaity within List Widget", function() {
    // Drag and Drop list Widget
    // Click on page 2
    // Ensure list widget will be redirected to page 2
    // Click on next button
    // Ensure the list widget will be redirected to page 3
    // Click on Previous button
    // Ensure the list widget will be redirected to page 2
    // Mouse Hover on the next button
    // Ensure the tool tip message is appropriate
    // Mouse Hover on the Previous button
    // Ensure the tool tip message is appropriate
  });

  it("Add new item in the list widget array object", function() {
    //Drag and drop list widget
    //Click to open an property pane
    //Expand Genearl section
    //Add the following new item
    //("id": 7,"num": 007",name": Charizard",img": "http://www.serebii.net/pokemongo/pokemon/006.png")
    //Ensure the new item gets added to the list widget without any error
    //Check for the new page is added upon adding new items
  });

  it("Adding apt widget into the List widget", function() {
    //Drag and Drop List widget
    //Expand the section 1 size in the list widget
    //Ensure by exapdning section inside list widget the page size gets increased
    //Drag and Drop button widget inside list widget
    //Ensure Button widget can be placed inside list Widget
    //Drag and Drop Image widget inside list widget
    //Ensure Image widget can be placed inside list widget
    // Drag and drop the text widget inside the list widget
    // Ensure text widget can be place inside the list widget
  });

  it("Adding unapt widget to identify the error message", function() {
    //Drag and Drop List widget
    //Expand the section 1 size in the list widget
    //Drag and Drop widgets ie: Chart ,Date Picker radio button etc
    // Ensure an understandable error message is displayed to user
  });
});
