const dsl = require("../../../fixtures/tableWidgetDsl.json");

describe("API associated with Datasource", function() {
    it("Adding an API to Datasource", function() 
    {
        // Create an application
        // Click on the + icon of the API 
        // Click on Create API option
        // Add an API 
        // Click on the three dots
        // Select "Set as Datasource"  
        // Click on "Test"
        //Click on the "Save"
    }
    )
    it("Edit name of the Datasource from Pane and refeclected in the Page ", function() 
    {
        // Click on the API datasource 
        // Click on Action icon (Three Dots)
        // Click on "Edit Name"
        // Rename the Datasource
        // Click on the datasource
        // Ensure the name is updated on the Page 
    }
    )
    it("Edit name of the Datasource from Page and refeclected in the Pane", function() 
    {
        // Click on the API datasource 
        // Navigate to respective 
        // Click on "Edit " option next to the Name of the datasource
        // Rename the Datasource
        // Ensure the name is updated in the Pane 
    }
    )
    it("Edit the API Datasource", function() 
    {
        // Click on the API datasource 
        // Ensure navigation to respective page
        // Click on "EDIT"
        // Make some changes 
        // Click on Test 
        // Click on Save
        // Ensure it is refelected in the API 
    }
    )
    it("Delete an API Datasource", function() 
    {
        // Delete the API associted 
        // Navigate to the Datasource
        // Click on Action icon (Three Dots)
        // Click on "Delete"
        // Ensure it is deleted
    }
    )
    it("Error on trying to Deleting an API Datasource when associated with API  ", function() 
    {
        // Click on API associated Datasource
        // Navigate to respective page 
        // Click on "Delete"
        // Ensure an error message is displayed to user
    }
    )
    it("Adding the API to an exsisting Datasource", function() 
    {
        // Click on exsisting Datasource
        // Navigate to Datasource list page 
        // Click on "+ New API"
        // Ensure new API is added in the RHS Pane
        // Click on "Run"
    }
    )
    it("Adding Headers to Datasource", function() 
    {
        // Click on API associated Datasource
        // Navigate to respective page 
        // Click on Add icon in the header section
        // Ensure the Field are added 
        // Now Click on the Delete icon present next to the Fields added 
        // Ensure Fields are deleted
        // Click on "Save"
    }
    )
    it("Refresh an Datasource  ", function() 
    {
        // Navigate to the Datasource
        // Click on Action icon (Three Dots)
        // Click on "Refresh"
        // Ensure loading icon 
    }
    )
}
)
