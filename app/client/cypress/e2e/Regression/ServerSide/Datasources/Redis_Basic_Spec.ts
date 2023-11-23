import {
  agHelper,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Validate Redis DS", () => {
  before("Create a new Redis DS", () => {
    dataSources.CreateDataSource("Redis");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("Create HAST set (Multiple key value pair under single key name) in redis DB, Read, Delete", () => {
    let hSetReceipe = `HSET recipe:1 name "Vegetable Stir Fry" ingredients "2 cups mixed vegetables (broccoli, carrots, bell peppers, mushrooms, snow peas), 2 cloves garlic, minced" instructions "1. Heat vegetable oil in a large skillet over medium-high heat. 2. Add mixed vegetables and garlic to the skillet and cook for 3-4 minutes. 3. In a small bowl, whisk together soy sauce and cornstarch. 4. Pour the soy sauce mixture over the vegetables and stir until the vegetables are coated. 5. Cook for an additional 1-2 minutes. 6. Serve hot." difficulty "easy"`;
    let hGetKeys = "HGET recipe:1 name";
    let hMGet = "HMGET recipe:1 difficulty name"; // getting multiple keys
    let hUpdate = "HSET recipe:1 difficulty medium";
    let getUpdatedKey = "HGET recipe:1 difficulty";
    let getAll = "HGETALL recipe:1";
    let addNewKeyValue = `HSET recipe:1 prep_time "10 minutes"`;
    let deletehKey = "DEL recipe:1";

    //Add HSET
    dataSources.CreateQueryAfterDSSaved();
    dataSources.EnterQuery(hSetReceipe);
    dataSources.RunQueryNVerifyResponseViews(1); //verify all views are returned!
    dataSources.AssertQueryTableResponse(0, "4"); //Success response for 4 keys inserted via above HSET!

    //Read only one key from above HSET
    dataSources.EnterQuery(hGetKeys);
    dataSources.RunQueryNVerifyResponseViews(1); //verify all views are returned!
    dataSources.AssertQueryTableResponse(0, "Vegetable Stir Fry");

    //Read more than one key from above HSET
    dataSources.EnterQuery(hMGet);
    dataSources.RunQueryNVerifyResponseViews(2);
    dataSources.AssertQueryTableResponse(0, "easy");
    dataSources.AssertQueryTableResponse(1, "Vegetable Stir Fry");

    //Update key value in HSET
    dataSources.EnterQuery(hUpdate);
    dataSources.RunQueryNVerifyResponseViews(1); //verify all views are returned!

    //validate updated key
    dataSources.EnterQuery(getUpdatedKey);
    dataSources.RunQueryNVerifyResponseViews(1);
    dataSources.AssertQueryTableResponse(0, "medium");

    //Get All keys from HSET
    dataSources.EnterQuery(getAll);
    dataSources.RunQueryNVerifyResponseViews(8); //4 keys, 4 values
    dataSources.ReadQueryTableResponse(0).then(($cellData: any) => {
      expect($cellData).to.be.oneOf([
        "name",
        "ingredients",
        "instructions",
        "difficulty",
      ]);
    });
    // dataSources.ReadQueryTableResponse(6).then(($cellData: any) => {
    //   expect($cellData).to.eq("instructions");
    // });//order not always matching - hence commented

    //Ading one more key/value to HSET
    dataSources.EnterQuery(addNewKeyValue);
    dataSources.RunQueryNVerifyResponseViews(1);

    //Verify new key/value also added to HSET
    dataSources.EnterQuery(getAll);
    dataSources.RunQueryNVerifyResponseViews(10); //5 keys, 5 values
    dataSources.ReadQueryTableResponse(0).then(($cellData: any) => {
      expect($cellData).to.be.oneOf([
        "name",
        "ingredients",
        "instructions",
        "difficulty",
        "prep_time",
      ]);
    });

    //Deleting the Hash key
    dataSources.EnterQuery(deletehKey);
    dataSources.RunQueryNVerifyResponseViews(1);

    //Verify Deletion is success
    dataSources.EnterQuery(hGetKeys);
    dataSources.RunQueryNVerifyResponseViews(); //5 keys, 5 values
    dataSources.AssertQueryTableResponse(0, "null");
  });

  after("Delete the query & datasource", () => {
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    dataSources.DeleteDatasourceFromWithinDS(dsName);
    //commenting below since after query delete, we run into risk of not seeing the datasource in EntityExplorer
    // EditorNavigation.SelectEntityByName(dsName, EntityType.Datasource);
    // entityExplorer.ActionContextMenuByEntityName({
    //   entityNameinLeftSidebar: dsName,
    //   action: "Delete",
    //   entityType: entityItems.Datasource,
    // });
  });
});
