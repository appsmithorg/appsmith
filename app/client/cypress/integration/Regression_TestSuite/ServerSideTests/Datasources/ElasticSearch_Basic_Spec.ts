import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any, books: any;
describe("Validate Elasticsearch DS", () => {
  before("Create a new ElasticSearch DS", () => {
    _.dataSources.CreateDataSource("Elasticsearch");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Validate POST/GET/PUT/DELETE", () => {
    let singleBook = `{
      "title": "The Lord of the Rings",
      "author": "J.R.R. Tolkien",
      "genre": ["Fantasy", "Adventure"],
      "rating": 4.8,
      "published_date": "1954-07-29",
      "description": "The Lord of the Rings is an epic high fantasy novel written by English author and scholar J. R. R. Tolkien. The story began as a sequel to Tolkien's earlier fantasy book The Hobbit and soon developed into a much larger story."
    }`;

    let bulkBooks = `{ "index": {"_index": "books", "_id": "2"}}
    { "title": "To Kill a Mockingbird", "author": "Harper Lee", "genre": ["Classic Literature", "Coming-of-Age"], "rating": 4.5, "published_date": "1960-07-11", "description": "To Kill a Mockingbird is a novel by Harper Lee, published in 1960. It is a coming-of-age story about a young girl named Scout Finch in a fictional town in Alabama during the Great Depression. The novel is renowned for its warmth and humor, despite dealing with serious issues of rape and racial inequality." }
    { "index": {"_index": "books", "_id": "3"}}
    { "title": "The Hitchhiker's Guide to the Galaxy", "author": "Douglas Adams", "genre": ["Science Fiction", "Comedy"], "rating": 4.4, "published_date": "1979-10-12", "description": "The Hitchhiker's Guide to the Galaxy is a comedy science fiction series created by Douglas Adams. It follows the misadventures of hapless human Arthur Dent and his alien friend Ford Prefect as they travel through space and time." }`;
    _.dataSources.CreateQueryAfterDSSaved();

    //POST - single record
    _.dataSources.ValidateNSelectDropdown("Method", "GET", "POST");

    _.agHelper.EnterValue("/books/_doc/1", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });

    _.agHelper.EnterValue(singleBook, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });

    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(JSON.stringify(resObj.response.body.data.body.result));
      expect(books).to.eq("created");
    });

    //GET - single record
    _.dataSources.ValidateNSelectDropdown("Method", "POST", "GET");
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(
        JSON.stringify(resObj.response.body.data.body._source.title),
      );
      expect(books).to.eq("The Lord of the Rings");
    });

    //POST - bulk record
    _.dataSources.ValidateNSelectDropdown("Method", "GET", "POST");

    _.agHelper.EnterValue("/_bulk", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });

    //Not able to use below since, we need to enter new line at end
    // _.agHelper.EnterValue(bulkBooks, {
    //   propFieldName: "",
    //   directInput: false,
    //   inputFieldName: "Body",
    // });

    _.agHelper.TypeIntoTextArea(_.dataSources._bodyCodeMirror, bulkBooks);

    _.agHelper.PressEnter();

    _.agHelper.Sleep();
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      expect(
        JSON.parse(
          JSON.stringify(resObj.response.body.data.body.items[0].index._id),
        ),
      ).to.eq("2");
      expect(
        JSON.parse(
          JSON.stringify(resObj.response.body.data.body.items[1].index._id),
        ),
      ).to.eq("3");
    });

    //GET - All inserted record
    _.dataSources.ValidateNSelectDropdown("Method", "POST", "GET");
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });

    _.agHelper.EnterValue("/books/_search", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(
        JSON.stringify(resObj.response.body.data.body.hits.total.value),
      );
      expect(books).to.eq(3);
    });

    //PUT - update
    let updateBook = `{ "title": "Pride and Prejudice", "author": "Jane Austen", "genre": ["Romance", "Classic Literature"], "rating": 4.5, "published_date": "1813-01-28", "description": "Pride and Prejudice is a romantic novel by Jane Austen, first published in 1813. The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of the British Regency." }`;
    _.dataSources.ValidateNSelectDropdown("Method", "GET", "PUT");

    _.agHelper.EnterValue("/books/_doc/1", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });

    _.agHelper.EnterValue(updateBook, {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });
    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(JSON.stringify(resObj.response.body.data.body.result));
      expect(books).to.eq("updated");
    });

    //GET - single record - after update
    _.dataSources.ValidateNSelectDropdown("Method", "PUT", "GET");
    _.agHelper.EnterValue("", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Body",
    });
    _.dataSources.RunQuery();
    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(
        JSON.stringify(resObj.response.body.data.body._source.title),
      );
      expect(books).to.eq("Pride and Prejudice");
    });

    //DELETE - single record
    _.dataSources.ValidateNSelectDropdown("Method", "GET", "DELETE");

    _.agHelper.EnterValue("/books/_doc/1", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });
    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(JSON.stringify(resObj.response.body.data.body.result));
      expect(books).to.eq("deleted");
    });

    //DELETE - all records
    _.agHelper.EnterValue("/_all", {
      propFieldName: "",
      directInput: false,
      inputFieldName: "Path",
    });
    _.dataSources.RunQuery();

    cy.get("@postExecute").then((resObj: any) => {
      books = JSON.parse(
        JSON.stringify(resObj.response.body.data.body.acknowledged),
      );
      expect(books).to.be.true;
    });
  });

  after("Delete the query & datasource", () => {
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.SelectEntityByName(dsName, "Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.ValidateNetworkStatus("@deleteDatasource", 200);
  });
});
