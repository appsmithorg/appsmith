import {
  agHelper,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Validate Elasticsearch DS",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    let dsName: any,
      books: any,
      containerName = "elasticsearch";

    before("Create a new ElasticSearch DS", () => {
      dataSources.StartContainerNVerify("Elasticsearch", containerName, 45000);
      dataSources.CreateDataSource("Elasticsearch");
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
      dataSources.CreateQueryAfterDSSaved();

      //POST - single record
      dataSources.ValidateNSelectDropdown("Method", "GET", "POST");

      agHelper.EnterValue("/books/_doc/1", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });

      agHelper.EnterValue(singleBook, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body.result),
        );
        expect(books).to.eq("created");
      });

      //GET - single record
      dataSources.ValidateNSelectDropdown("Method", "POST", "GET");
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body._source.title),
        );
        expect(books).to.eq("The Lord of the Rings");
      });

      //POST - bulk record
      dataSources.ValidateNSelectDropdown("Method", "GET", "POST");

      agHelper.EnterValue("/_bulk", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });

      //We need to enter new line at end, since without that body data not getting considered
      agHelper.EnterValue(bulkBooks, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });

      agHelper
        .GetElement(dataSources._bodyCodeMirror)
        .type("{downarrow}".repeat(10));

      agHelper.PressEnter();

      agHelper.Sleep(2000);
      dataSources.RunQuery();
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
      dataSources.ValidateNSelectDropdown("Method", "POST", "GET");
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });

      agHelper.EnterValue("/books/_search", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body.hits.total.value),
        );
        expect(books).to.be.oneOf([1, 3]);
      });

      //PUT - update
      let updateBook = `{ "title": "Pride and Prejudice", "author": "Jane Austen", "genre": ["Romance", "Classic Literature"], "rating": 4.5, "published_date": "1813-01-28", "description": "Pride and Prejudice is a romantic novel by Jane Austen, first published in 1813. The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of the British Regency." }`;
      dataSources.ValidateNSelectDropdown("Method", "GET", "PUT");

      agHelper.EnterValue("/books/_doc/1", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });

      agHelper.EnterValue(updateBook, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });

      agHelper
        .GetElement(dataSources._bodyCodeMirror)
        .type("{downarrow}".repeat(5));

      agHelper.PressEnter();
      agHelper.Sleep(2000);
      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body.result),
        );
        expect(books).to.eq("updated");
      });

      //GET - single record - after update
      dataSources.ValidateNSelectDropdown("Method", "PUT", "GET");
      agHelper.EnterValue("", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Body",
      });
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body._source.title),
        );
        expect(books).to.eq("Pride and Prejudice");
      });

      //DELETE - single record
      dataSources.ValidateNSelectDropdown("Method", "GET", "DELETE");

      agHelper.EnterValue("/books/_doc/1", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });
      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body.result),
        );
        expect(books).to.eq("deleted");
      });

      //DELETE - all records
      agHelper.EnterValue("/_all", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Path",
      });
      dataSources.RunQuery();

      cy.get("@postExecute").then((resObj: any) => {
        books = JSON.parse(
          JSON.stringify(resObj.response.body.data.body.acknowledged),
        );
        expect(books).to.be.true;
      });
    });

    after("Delete the query & datasource", () => {
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(dsName);
      dataSources.StopNDeleteContainer(containerName);
    });
  },
);
