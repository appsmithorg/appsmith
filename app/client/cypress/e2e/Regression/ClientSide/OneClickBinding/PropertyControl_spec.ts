import {
  entityExplorer,
  draggableWidgets,
  agHelper,
  dataSources,
  propPane,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import { expandLoadMoreOptions, OneClickBinding } from "./spec_utility";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import onboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

const oneClickBinding = new OneClickBinding();

const upfrontContentCount = 4;

describe("excludeForAirgap", "One click binding control", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400);
  });

  it("1. Should check the datasource selector and the form", () => {
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);
    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    entityExplorer.NavigateToSwitcher("Explorer", 0, true);

    dataSources.CreateMockDB("Users").then(($createdMockUsers) => {
      dataSources.CreateQueryAfterDSSaved();
    });

    cy.wait(500);

    entityExplorer.NavigateToSwitcher("Widgets");
    entityExplorer.NavigateToSwitcher("Explorer");
    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );

    agHelper.AssertElementLength(
      oneClickBindingLocator.datasourceQuerySelector(),
      1,
    );

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );

    agHelper.AssertElementExist(oneClickBindingLocator.datasourceSelector());

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceOtherActionsSelector,
    );

    agHelper.AssertElementExist(oneClickBindingLocator.otherActionSelector());
    agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Connect new datasource"),
    );

    agHelper.AssertElementExist(onboardingLocator.datasourcePage);

    agHelper.GetNClick(onboardingLocator.datasourceBackBtn);

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceDropdownOptionSelector("Query1"),
    );

    agHelper.GetNClick(oneClickBindingLocator.datasourceQuerySelector(), 0);

    agHelper.AssertElementExist(
      oneClickBindingLocator.dropdownOptionSelector("Query1"),
    );

    propPane.ToggleJSMode("Table data");

    propPane.ValidatePropertyFieldValue("Table data", "{{Query1.data}}");

    propPane.AssertJSToggleState("Table data", "enabled");

    propPane.UpdatePropertyFieldValue("Table data", "{{Query1.data1}}");

    propPane.AssertJSToggleState("Table data", "disabled");

    propPane.UpdatePropertyFieldValue("Table data", "{{Query1.data}}");

    propPane.AssertJSToggleState("Table data", "enabled");

    propPane.ToggleJSMode("Table data", false);

    oneClickBinding.ChooseAndAssertForm(
      "Users",
      "Users",
      "public.users",
      "gender",
    );

    propPane.MoveToTab("Style");

    propPane.MoveToTab("Content");

    oneClickBinding.ChooseAndAssertForm(
      "sample Movies",
      "movies",
      "movies",
      "status",
    );

    entityExplorer.NavigateToSwitcher("Explorer");
    dataSources.NavigateToDSCreateNew();
    dataSources.CreatePlugIn("Mongo");
    agHelper.RenameWithInPane("myinvalidds", false);

    agHelper.UpdateInputValue(dataSources._host, "127.0.0.1");
    agHelper.UpdateInputValue(dataSources._port, "8000");

    dataSources.SaveDatasource();

    entityExplorer.NavigateToSwitcher("Widgets");

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    expandLoadMoreOptions();

    agHelper.GetNClick(
      oneClickBindingLocator.datasourceSelector("myinvalidds"),
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });

  it("2. should check that load more options and search", () => {
    [1, 2].forEach((I) => {
      entityExplorer.NavigateToSwitcher("Explorer");
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Mongo");
      agHelper.RenameWithInPane(`dummy${I}`, false);

      agHelper.UpdateInputValue(dataSources._host, "127.0.0.1");
      agHelper.UpdateInputValue(dataSources._port, "8000");

      dataSources.SaveDatasource();

      entityExplorer.NavigateToSwitcher("Widgets");
    });

    propPane.MoveToTab("Style");

    propPane.MoveToTab("Content");

    entityExplorer.NavigateToSwitcher("Explorer");

    [1, 2, 3, 4, 5].forEach(() => {
      apiPage.CreateAndFillApi("http://www.example.com");
    });

    entityExplorer.NavigateToSwitcher("Widgets");

    entityExplorer.SelectEntityByName("Table1");

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    agHelper
      .GetElement(oneClickBindingLocator.datasourceQuerySelector())
      .then(($ele) => {
        expect($ele.length).equals(upfrontContentCount);
      });

    agHelper.AssertElementExist(oneClickBindingLocator.loadMore);

    agHelper.GetNClick(oneClickBindingLocator.loadMore, 0);

    agHelper
      .GetElement(oneClickBindingLocator.datasourceQuerySelector())
      .then(($ele) => {
        expect($ele.length).greaterThan(upfrontContentCount);
      });

    agHelper
      .GetElement(oneClickBindingLocator.datasourceSelector())
      .then(($ele) => {
        expect($ele.length).equals(upfrontContentCount);
      });

    agHelper.AssertElementExist(oneClickBindingLocator.loadMore);

    agHelper.GetNClick(oneClickBindingLocator.loadMore, 0);

    agHelper
      .GetElement(oneClickBindingLocator.datasourceSelector())
      .then(($ele) => {
        expect($ele.length).greaterThan(upfrontContentCount);
      });
  });

  it("3. should test the search input function", () => {
    agHelper
      .GetElement(oneClickBindingLocator.datasourceQuerySelector())
      .then(($ele) => {
        expect($ele.length).greaterThan(upfrontContentCount);
      });

    agHelper.TypeText(oneClickBindingLocator.datasourceSearch, "Api1");

    agHelper
      .GetElement(oneClickBindingLocator.datasourceQuerySelector())
      .then(($ele) => {
        expect($ele.length).equals(1);
      });

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );

    agHelper.TypeText(oneClickBindingLocator.datasourceSearch, "Api123");

    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceQuerySelector(),
    );

    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceQueryBindHeaderSelector,
    );

    agHelper.ClearTextField(oneClickBindingLocator.datasourceSearch);

    agHelper
      .GetElement(oneClickBindingLocator.datasourceSelector())
      .then(($ele) => {
        expect($ele.length).greaterThan(upfrontContentCount);
      });

    agHelper.TypeText(oneClickBindingLocator.datasourceSearch, "myinvalidds");

    agHelper
      .GetElement(oneClickBindingLocator.datasourceSelector())
      .then(($ele) => {
        expect($ele.length).equals(1);
      });

    agHelper.AssertElementExist(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );

    agHelper.TypeText(
      oneClickBindingLocator.datasourceSearch,
      "myinvalidds123",
    );

    agHelper.AssertElementAbsence(oneClickBindingLocator.datasourceSelector());

    agHelper.AssertElementAbsence(
      oneClickBindingLocator.datasourceGenerateAQuerySelector,
    );
  });
});
