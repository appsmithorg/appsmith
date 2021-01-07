const commonlocators = require("../../../locators/commonlocators.json");

describe("API associated with Datasource", function() {
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
    it("Refresh an Datasource  ", function() 
    {
        // Navigate to the Datasource
        // Click on Action icon (Three Dots)
        // Click on "Refresh"
        // Ensure loading icon 
    }
    )
    it("User must be displayed with error message when tried to run an empty API ", function() 
    {
        // Navigate to the API
        // Click on "RUN"
        // Ensure an Information j /Ún80jq3message is dispalyed in the Response Body

    }
    )
    
}
)
