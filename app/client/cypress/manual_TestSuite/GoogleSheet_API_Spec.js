const queryLocators = require("../../../locators/QueryEditor.json");
const queryEditor = require("../../../locators/QueryEditor.json");
let datasourceName;

describe("Test Ideas for GooglSheet API", function() {
  it("Add a Datasource", function() {
    //Add the datasource to Email Id
    //Ensure different Email Id can be associate to different Email Id
    //Ensure Datasource has two action "Read Only" and "Read"
    //Ensure user can Save the Datasource
    //Click on "Add API"
  });

  it("List API", function() {
    //Select the Method "List Sheet"
    //Ensure response : URL and Name of the sheet
    //Ensure "Add Widget" is displayed to user
    //Ensure click on Add widget the data gets populated on the widget
  });

  it("Fetch a Sheet", function() {
    //Select the Method "Fetch Sheet"
    //Ensure response :id,name,createdTime,modifiedTime,permissions
  });

  it("Create New Sheet", function() {
    //Ensure the response is appropriate
    //Ensure to select the method
    //Ensure to select a new name to the spreadsheet
    //Provide an existing name to the new sheet and observe sheet should be created
    //Send a empty response body and ensure an empty sheet is created in the email Id selected
    //Enter sheet name as special charaters,alphanumeric keys and number and observe
    //Send the response body with defined value and ensure the data is added
  });

  it("Insert a sheet or Update a sheet", function() {
    //Ensure to select the method
    //Ensure to add the spreadsheet URL
    //Ensure add the sheet name in which it needs to be inserted
    //Ensure add the Table Heading Row Index
    //Ensure to add appropriate raw object
    //Ensure to submit one row empty each time and account the error
    //Ensure to make changes in the raw object to throw error
    //Add inappropriate data in each field to get appropriate error
    //Add few inappropritae row name and value and check for partial insertion
    //Miss an "rowIndex" field and check for and error
    //Ensure to update the "headername"
  });

  it("Bulk Insert or Bulk Update", function() {
    //Ensure to select the method
    //Ensure to add the spreadsheet URL
    //Ensure add the Table Heading Row Index
    //Ensure to add appropriate raw object
    //Add inappropriate data in each field to get appropriate error
    //Add few inappropritae row name and value and check for partial insertion
    //Try inserting without Row Index - Row index is not manadate of insert
    //Add Different Sheet Url from the same doc and correct sheet name ensure teh correct gets updated
    //Add doc URL different and name of sheet that doesnt exsit in the doc and ensure the error is displayed
  });

  it("Delete a Row", function() {
    //Ensure to select the method
    //Ensure to add the spreadsheet URL
    //Ensure to add the sheet name
    //Ensure add the Table Heading Row Index
    //Ensure to add the valid index
    //Enter index as 0 and check if the table header is not deleted
    //Enter index as on and check the first data value gets deleted
  });

  it("Delete a Sheet", function() {
    //Ensure to select the method
    //Ensure to add the spreadsheet URL
    //Ensure to add the sheet name
    //Choose Entity has Single and try to delete the only one sheet which is available in the spreadsheet and check for the error messageEntity
    //Choose Entity has Entire spreadsheet and try to deleted the sheet
  });

  it("Fetch Sheet Rows", function() {
    //Ensure to select the method
    //Ensure to add the spreadsheet URL
    //Ensure to add the sheet name
    //Enter the Table heading row index
    //Choose the Query format as Query range and enter valid Range for example A2:B
    //Choose the Query format as Query range and enter invalid Range and check for the error message
    //Choose the Query format as Query rows and pass the valid Row limit and row offset
    //Choose the Query format as Query rows and pass the invalid Row limit and row offset and check for the error message
  });
});
