const queryLocators = require("../../../locators/QueryEditor.json");
const queryEditor = require("../../../locators/QueryEditor.json");
let datasourceName;

describe("Test Ideas for Mongo DB Form Input", function() {
    it("Insert a Document", function() {
        //Ensure by choosing command as 'Insert a Document' the following fields will be displayed 'Collection Name' and 'Documents'
        //Click on Command and enter command name
        //Clicking on Collection name field ensure Evaluvated value popup appears and Evaluvated value should match 
        //Click on Document and pass the following valid query
        //Clicking on Document field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on run and ensure query runs successfuly
        //Try passing the invalid query in the document and run and verfiy the error message       
    })

    it("Find One or More Document", function() {
      //  Ensure by choosing command as 'Find one or more Document' the following fields will be displayed 'Collection Name' ,  'Query' ,  'Sort' , 'Projection' , 'Limit' and 'Skip'
      //Click on collection name and enter valid collection name (In which document is inserted ealrier)
      //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
      //Click on Query field and pass {} to get all the documents inside the collection
      //Pass the following value in the query field to get particular document in an collection {"_id":ObjectId("id")}
      //Clicking on Query field ensure Evaluvated value popup appears and Evaluvated value should match
      //click on run and ensure query runs successfully
      //Compare the response with the document inserted earlier and value should match
    })

    it("Update One Document", function(){
        //Ensure by choosing command as 'Update one Document' the following fields will be displayed 'Collection Name' ,  'Query' ,  'Sort'  and 'Update'
        //Click on collection name and enter valid collection name (In which document is inserted ealrier)
        //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on Query field and pass {} to get all the documents inside the collection
        //Pass the following value in the query field to get particular document in an collection {"_id":ObjectId("id")}
        //Clicking on Query field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on Update field and pass the following query {"set":{"status":"Inactive"}}
        //Repeat 'Find one or More Document' scenario and verfiy if the update results are matching
        //click on run and ensure query runs successfully
        //Click on Update field and pass any invalid query and ensure query response with appropriate error message
    })

    it("Update One or More Document", function(){
        //Ensure by choosing command as 'Update one or More Document' the following fields will be displayed 'Collection Name' ,  'Query' and 'Update'
        //Click on collection name and enter valid collection name (In which document is inserted ealrier)
        //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on Query field and pass {} to get all the documents inside the collection
        //Pass the following value in the query field to get particular document in an collection {"_id":ObjectId("id")}
        //Clicking on Query field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on Update field and pass the following query {"set":{"status":"Inactive"}}
        //Repeat 'Find one or More Document' scenario and verify if the update results are matching
        //click on run and ensure query runs successfully
        //Click on Update field and pass any invalid query and ensure query response with appropriate error message
    })

    it("Delet One or More Document", function(){
        //Ensure by choosing command as 'Delete one or more Document' the following fields will be displayed 'Collection Name' ,  'Query' and 'limit'
        //Ensure limit has two option 'Single Document' and 'All Matching document'
        //Click on collection name and enter valid collection name (In which document is inserted ealrier)
        //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
        //Choose limit as single document and in the query pass the document id which needs to be deleted {"_id":ObjectId("id")}
        //Clicking on Query field ensure Evaluvated value popup appears and Evaluvated value should match
        //Click on run and ensure the query runs successfully 
        //Repeat 'Find one or More Document' scenario and verify if the specified document is deleted
        //Choose limit as All Matching document and in the query pass {} to delete all the document or pass multi id's
        //Click on run and ensure the query runs successfully 
        //Repeat 'Find one or More Document' scenario and verify if the specified document is deleted
    })

    it("Perform Distinct Operation on a Document", function(){
        //Ensure by choosing command as 'Count' the following fields will be displayed 'Collection Name' , 'Query' and 'Key/Field' 
        //Click on collection name and enter valid collection name (In which document is inserted ealrier)
        //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
    })

    it("Perform Aggregate Operation on a Document", function(){
        //Ensure by choosing command as 'Count' the following fields will be displayed 'Collection Name' and 'Array of Pipelines'
        //Click on collection name and enter valid collection name (In which document is inserted ealrier)
        //Clicking on Collection Name field ensure Evaluvated value popup appears and Evaluvated value should match
    })
})

