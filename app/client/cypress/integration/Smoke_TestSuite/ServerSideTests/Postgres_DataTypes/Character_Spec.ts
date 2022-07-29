import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, query: string;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Character Datatype tests", function() {
  before(() => {
    cy.fixture("Datatypes/CharacterDTdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    propPane.ChangeTheme("Pacific");
  });

  it("1. Create Postgress DS", function() {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Creating table - chartypes", () => {
    query = `create table charTypes(serialid serial primary key, "One(1)" char, "AsMany" varchar, "Limited(4)" varchar(4), "Unlimited" text)`;
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("createTable");
    dataSources.EnterQuery(query);
    agHelper.FocusElement(locator._codeMirrorTextArea);
    dataSources.RunQuery();
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementVisible(ee._entityNameInExplorer("public.chartypes"));
  });

  it("3. Creating SELECT query - chartypes + Bug 14493", () => {
    query = `SELECT *, char_length("AsMany") as "AsMany-Len", char_length("Unlimited") as "Unlimited-Len" FROM public."chartypes" as charT LIMIT 10;`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "SELECT");
    agHelper.RenameWithInPane("selectRecords");
    dataSources.RunQuery();
    agHelper
      .GetText(dataSources._noRecordFound)
      .then(($noRecMsg) => expect($noRecMsg).to.eq("No data records to show"));
    dataSources.EnterQuery(query);
  });

  it("4. Creating all queries - chartypes", () => {
    query = `INSERT INTO public."chartypes" ("One(1)", "AsMany", "Limited(4)", "Unlimited")
    VALUES ({{Insertone.text}}, {{Insertasmany.text}}, {{Insertlimited.text}}::varchar(4), {{Insertunlimited.text}});`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "INSERT");
    agHelper.RenameWithInPane("insertRecord");
    dataSources.EnterQuery(query);

    query = `UPDATE public."chartypes" SET
    "One(1)" = {{Updateone.text}},
    "AsMany" = {{Updateasmany.text}},
    "Limited(4)" = {{Updatelimited.text}}::varchar(4),
    "Unlimited" = {{Updateunlimited.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "UPDATE");
    agHelper.RenameWithInPane("updateRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."chartypes"
    WHERE serialId = {{Table1.selectedRow.serialid}};`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "DELETE");
    agHelper.RenameWithInPane("deleteRecord");
    dataSources.EnterQuery(query);

    query = `DELETE FROM public."chartypes"`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "DELETE");
    agHelper.RenameWithInPane("deleteAllRecords");
    dataSources.EnterQuery(query);

    query = `drop table public."chartypes"`;
    ee.ActionTemplateMenuByEntityName("public.chartypes", "DELETE");
    agHelper.RenameWithInPane("dropTable");
    dataSources.EnterQuery(query);
    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity(dsName, false);
  });

  it("5. Inserting record (null values) - chartypes", () => {
    ee.SelectEntityByName("Page1");
    deployMode.DeployApp();
    table.WaitForTableEmpty(); //asserting table is empty before inserting!
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq(" "); //white space for padding length!
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    table.ReadTableRowColumnData(0, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    table.ReadTableRowColumnData(0, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("6. Inserting record (not null values) - chartypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("One_1_", "a");
    agHelper.EnterInputText(
      "AsMany",
      "Sailing ships were used for thousands of years!",
    );
    agHelper.EnterInputText("Limited_4_", "Ocean");
    agHelper.EnterInputText(
      "Unlimited",
      "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
      false,
      false,
    );
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("a");
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Ocea"); //asserting only 4 chars are inserted due to column dt constraint
    });
    table.ReadTableRowColumnData(1, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
    table.ReadTableRowColumnData(1, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
  });

  it("7. Inserting another record (not null values) - chartypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("One_1_", "<");
    agHelper.EnterInputText(
      "AsMany",
      "Some planes can fly for more than five hours after one of their engines goes out.!",
    );
    agHelper.EnterInputText("Limited_4_", "Planes");
    agHelper.EnterInputText(
      "Unlimited",
      " In fact, according to the FAA, there are 5,000 planes in the air over the United States at any moment in time, and more than 8,000 flying across the globe.",
      false,
      false,
    );
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("<");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Plan");
    });
    table.ReadTableRowColumnData(2, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    table.ReadTableRowColumnData(2, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
  });

  it("8. Updating record (emtying some field) - chartypes", () => {
    table.SelectTableRow(2);
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("One_1_", ">", true);
    agHelper.EnterInputText(
      "AsMany",
      "Dimming the aircraft's lights serves a purpose beyond sleep.!",
      true,
    );
    agHelper.EnterInputText("Limited_4_", "Flights", true);
    agHelper.ClearInputText("Unlimited", false);
    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq(">");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Flig");
    });
    table.ReadTableRowColumnData(2, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    table.ReadTableRowColumnData(2, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("9. Deleting records - chartypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.ValidateNetworkStatus("@postExecute", 200);
    agHelper.Sleep(2500); //Allwowing time for delete to be success
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
  });

  it("10. Updating record (null inserted record) - chartypes", () => {
    agHelper.ClickButton("Run UpdateQuery");
    agHelper.AssertElementVisible(locator._modal);
    //agHelper.EnterInputText("One_1_", "&");
    agHelper.EnterInputText(
      "AsMany",
      "First electric tram in England was opened in 1885 in Blackpool!",
    );
    agHelper.EnterInputText("Limited_4_", "Trams");
    agHelper.EnterInputText(
      "Unlimited",
      "The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.",
      false,
      false,
    );
    agHelper.ClickButton("Update");
    agHelper.AssertElementVisible(locator._spanButton("Run UpdateQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      //since record updated is moving to last row in table - BUg 14347!
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(1, 1, 200).then(($cellData) => {
      expect($cellData).to.eq(" "); //Not updating one column
    });
    table.ReadTableRowColumnData(1, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("Tram");
    });
    table.ReadTableRowColumnData(1, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    table.ReadTableRowColumnData(1, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
  });

  it("11. Inserting another record (+ve record - to check serial column) - chartypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.EnterInputText("One_1_", "e");
    agHelper.EnterInputText(
      "AsMany",
      "Sailing ships were used for thousands of years!",
    );
    agHelper.EnterInputText(
      "Unlimited",
      "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
      false,
      false,
    );
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(2, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(2, 1, 200).then(($cellData) => {
      expect($cellData).to.eq("e");
    });
    table.ReadTableRowColumnData(2, 3, 200).then(($cellData) => {
      expect($cellData).to.eq(""); //asserting empty field inserted
    });
    table.ReadTableRowColumnData(2, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
    table.ReadTableRowColumnData(2, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
  });

  it("12. Deleting records - chartypes", () => {
    table.SelectTableRow(1);
    agHelper.ClickButton("DeleteQuery", 1);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 3rd record is deleted
    });
    table.ReadTableRowColumnData(1, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
  });

  it("13. Deleting all records from table - chartypes", () => {
    agHelper.GetNClick(locator._deleteIcon);
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    agHelper.Sleep(2000);
    table.WaitForTableEmpty();
  });

  it("14. Inserting record (null record - to check serial column) - chartypes", () => {
    agHelper.ClickButton("Run InsertQuery");
    agHelper.AssertElementVisible(locator._modal);
    agHelper.ClickButton("Insert");
    agHelper.AssertElementVisible(locator._spanButton("Run InsertQuery"));
    table.ReadTableRowColumnData(0, 0, 2000).then(($cellData) => {
      expect($cellData).to.eq("5"); //asserting serial column is inserting fine in sequence
    });
    table.ReadTableRowColumnData(0, 1, 200).then(($cellData) => {
      expect($cellData).to.eq(" ");
    });
    table.ReadTableRowColumnData(0, 3, 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    table.ReadTableRowColumnData(0, 5, 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    table.ReadTableRowColumnData(0, 6, 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("15. Validate Drop of the Newly Created - chartypes - Table from Postgres datasource", () => {
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName("dropTable");
    dataSources.RunQuery();
    dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    ee.ExpandCollapseEntity("QUERIES/JS", false);
    ee.ExpandCollapseEntity("DATASOURCES");
    ee.ExpandCollapseEntity(dsName);
    ee.ActionContextMenuByEntityName(dsName, "Refresh");
    agHelper.AssertElementAbsence(ee._entityNameInExplorer("public.chartypes"));
    ee.ExpandCollapseEntity(dsName, false);
    ee.ExpandCollapseEntity("DATASOURCES", false);
  });

  it("16. Verify Deletion of the datasource after all created queries are Deleted", () => {
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.ActionContextMenuByEntityName("createTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "deleteAllRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("deleteRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("dropTable", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("insertRecord", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      "selectRecords",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("updateRecord", "Delete", "Are you sure?");
    deployMode.DeployApp();
    deployMode.NavigateBacktoEditor();
    ee.ExpandCollapseEntity("QUERIES/JS");
    dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
