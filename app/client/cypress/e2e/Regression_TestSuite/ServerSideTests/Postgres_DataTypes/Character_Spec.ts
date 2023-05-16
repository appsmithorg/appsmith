import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, query: string;

describe("Character Datatype tests", function () {
  before("Create Postgress DS", () => {
    cy.fixture("Datatypes/CharacterDTdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.appSettings.OpenPaneAndChangeTheme("Pacific");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Creating table - chartypes", () => {
    query = `create table charTypes(serialid serial primary key, "One(1)" char, "AsMany" varchar, "Limited(4)" varchar(4), "Unlimited" text)`;
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("createTable");
    _.agHelper.FocusElement(_.locators._codeMirrorTextArea);
    _.dataSources.RunQuery();
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementVisible(
      _.entityExplorer._entityNameInExplorer("public.chartypes"),
    );
  });

  it("2. Creating SELECT query - chartypes + Bug 14493", () => {
    query = `SELECT *, char_length("AsMany") as "AsMany-Len", char_length("Unlimited") as "Unlimited-Len" FROM public."chartypes" as charT LIMIT 10;`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "SELECT",
    );
    _.dataSources.RunQuery();
    _.agHelper
      .GetText(_.dataSources._noRecordFound)
      .then(($noRecMsg: any) =>
        expect($noRecMsg).to.eq("No data records to show"),
      );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("selectRecords");
  });

  it("3. Creating all queries - chartypes", () => {
    query = `INSERT INTO public."chartypes" ("One(1)", "AsMany", "Limited(4)", "Unlimited")
    VALUES ({{Insertone.text}}, {{Insertasmany.text}}, {{Insertlimited.text}}::varchar(4), {{Insertunlimited.text}});`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "INSERT",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("insertRecord");

    query = `UPDATE public."chartypes" SET
    "One(1)" = {{Updateone.text}},
    "AsMany" = {{Updateasmany.text}},
    "Limited(4)" = {{Updatelimited.text}}::varchar(4),
    "Unlimited" = {{Updateunlimited.text}}
  WHERE serialid = {{Table1.selectedRow.serialid}};`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "UPDATE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("updateRecord");

    query = `DELETE FROM public."chartypes"`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("deleteAllRecords");

    query = `drop table public."chartypes"`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("dropTable");

    query = `DELETE FROM public."chartypes" WHERE serialId = {{Table1.selectedRow.serialid}};`;
    _.entityExplorer.ActionTemplateMenuByEntityName(
      "public.chartypes",
      "DELETE",
    );
    _.dataSources.EnterQuery(query);
    _.agHelper.RenameWithInPane("deleteRecord");

    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
  });

  it("4. Inserting record (null values) - chartypes", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    _.deployMode.DeployApp();
    _.table.WaitForTableEmpty(); //asserting table is empty before inserting!
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(" "); //white space for padding length!
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    _.table.ReadTableRowColumnData(0, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    _.table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("5. Inserting record (not null values) - chartypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("One_1_", "a");
    _.agHelper.EnterInputText(
      "AsMany",
      "Sailing ships were used for thousands of years!",
    );
    _.agHelper.EnterInputText("Limited_4_", "Ocean");
    _.agHelper.EnterInputText(
      "Unlimited",
      "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
      false,
      false,
    );
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("2"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("a");
    });
    _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Ocea"); //asserting only 4 chars are inserted due to column dt constraint
    });
    _.table.ReadTableRowColumnData(1, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
    _.table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
  });

  it("6. Inserting another record (not null values) - chartypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("One_1_", "<");
    _.agHelper.EnterInputText(
      "AsMany",
      "Some planes can fly for more than five hours after one of their engines goes out.!",
    );
    _.agHelper.EnterInputText("Limited_4_", "Planes");
    _.agHelper.EnterInputText(
      "Unlimited",
      " In fact, according to the FAA, there are 5,000 planes in the air over the United States at any moment in time, and more than 8,000 flying across the globe.",
      false,
      false,
    );
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("<");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Plan");
    });
    _.table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    _.table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
  });

  it("7. Updating record (emtying some field) - chartypes", () => {
    _.table.SelectTableRow(2);
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("One_1_", ">", true);
    _.agHelper.EnterInputText(
      "AsMany",
      "Dimming the aircraft's lights serves a purpose beyond sleep.!",
      true,
    );
    _.agHelper.EnterInputText("Limited_4_", "Flights", true);
    _.agHelper.ClearInputText("Unlimited", false);
    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("3"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(">");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Flig");
    });
    _.table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    _.table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("8. Deleting records - chartypes", () => {
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.ValidateNetworkStatus("@postExecute", 200);
    _.agHelper.Sleep(2500); //Allwowing time for delete to be success
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("2"); //asserting 2nd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("3");
    });
  });

  it("9. Updating record (null inserted record) - chartypes", () => {
    _.agHelper.ClickButton("Run UpdateQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    //_.agHelper.EnterInputText("One_1_", "&");
    _.agHelper.EnterInputText(
      "AsMany",
      "First electric tram in England was opened in 1885 in Blackpool!",
    );
    _.agHelper.EnterInputText("Limited_4_", "Trams");
    _.agHelper.EnterInputText(
      "Unlimited",
      "The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.The word tram is used mainly outside North America, while within North America these vehicles are called streetcars or trolleys as they run mainly on streets.",
      false,
      false,
    );
    _.agHelper.ClickButton("Update");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run UpdateQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      //since record updated is moving to last row in table - BUg 14347!
      expect($cellData).to.eq("1"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(1, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(" "); //Not updating one column
    });
    _.table.ReadTableRowColumnData(1, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("Tram");
    });
    _.table.ReadTableRowColumnData(1, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
    _.table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0);
    });
  });

  it("10. Inserting another record (+ve record - to check serial column) - chartypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.EnterInputText("One_1_", "e");
    _.agHelper.EnterInputText(
      "AsMany",
      "Sailing ships were used for thousands of years!",
    );
    _.agHelper.EnterInputText(
      "Unlimited",
      "At one time, the steamships Titanic, Olympic, and Britannic were the largest ships in the world, Titanic sank on her maiden voyage after hitting an iceberg, becoming one of the most famous shipwrecks of all time",
      false,
      false,
    );
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(2, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(2, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("e");
    });
    _.table.ReadTableRowColumnData(2, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(""); //asserting empty field inserted
    });
    _.table.ReadTableRowColumnData(2, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
    _.table.ReadTableRowColumnData(2, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.be.greaterThan(0); //asserting length columns
    });
  });

  it("11. Deleting records - chartypes", () => {
    _.table.SelectTableRow(1);
    _.agHelper.ClickButton("DeleteQuery", 1);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).not.to.eq("3"); //asserting 3rd record is deleted
    });
    _.table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("4");
    });
  });

  it("12. Deleting all records from table - chartypes", () => {
    _.agHelper.GetNClick(_.locators._deleteIcon);
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.agHelper.Sleep(2000);
    _.table.WaitForTableEmpty();
  });

  it("13. Inserting record (null record - to check serial column) - chartypes", () => {
    _.agHelper.ClickButton("Run InsertQuery");
    _.agHelper.AssertElementVisible(_.locators._modal);
    _.agHelper.ClickButton("Insert");
    _.agHelper.AssertElementVisible(_.locators._spanButton("Run InsertQuery"));
    _.table.ReadTableRowColumnData(0, 0, "v1", 2000).then(($cellData) => {
      expect($cellData).to.eq("5"); //asserting serial column is inserting fine in sequence
    });
    _.table.ReadTableRowColumnData(0, 1, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq(" ");
    });
    _.table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
      expect($cellData).to.eq("");
    });
    _.table.ReadTableRowColumnData(0, 5, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
    _.table.ReadTableRowColumnData(0, 6, "v1", 200).then(($cellData) => {
      expect(Number($cellData)).to.eq(0);
    });
  });

  it("14. Validate Drop of the Newly Created - chartypes - Table from Postgres datasource", () => {
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.SelectEntityByName("dropTable");
    _.dataSources.RunQuery();
    _.dataSources.ReadQueryTableResponse(0).then(($cellData) => {
      expect($cellData).to.eq("0"); //Success response for dropped table!
    });
    _.entityExplorer.ExpandCollapseEntity("Queries/JS", false);
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ExpandCollapseEntity(dsName);
    _.entityExplorer.ActionContextMenuByEntityName(dsName, "Refresh");
    _.agHelper.AssertElementAbsence(
      _.entityExplorer._entityNameInExplorer("public.chartypes"),
    );
    _.entityExplorer.ExpandCollapseEntity(dsName, false);
    _.entityExplorer.ExpandCollapseEntity("Datasources", false);
  });

  it("15. Verify Deletion of the datasource after all created queries are Deleted", () => {
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 409); //Since all queries exists
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.entityExplorer.DeleteAllQueriesForDB(dsName);
    _.deployMode.DeployApp();
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.dataSources.DeleteDatasouceFromWinthinDS(dsName, 200); //ProductLines, Employees pages are still using this ds
  });
});
