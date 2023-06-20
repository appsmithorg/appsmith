import {
  entityExplorer,
  draggableWidgets,
  agHelper,
  dataSources,
  propPane,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import { OneClickBinding } from "./spec_utility";
import oneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import onboardingLocator from "../../../../locators/FirstTimeUserOnboarding.json";

const oneClickBinding = new OneClickBinding();

describe("excludeForAirgap", "One click binding control", () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 400);
  });

  it("1.Should check the datasource selector and the form", () => {
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
      dataSources.CreateQueryFromActiveTab($createdMockUsers, false);
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

    agHelper.GetNClick(
      oneClickBindingLocator.otherActionSelector("Insert binding"),
    );

    propPane.ValidatePropertyFieldValue("Table data", "{{}}");

    propPane.UpdatePropertyFieldValue("Table data", "");

    propPane.ToggleJSMode("Table data", false);

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
      "New from Users",
      "Users",
      "public.users",
      "gender",
    );

    propPane.MoveToTab("Style");

    propPane.MoveToTab("Content");

    oneClickBinding.ChooseAndAssertForm(
      "New from sample Movies",
      "Movies",
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

    cy.get("body").then(($ele) => {
      if ($ele.find(oneClickBindingLocator.loadMore).length > 0) {
        const length = $ele.find(oneClickBindingLocator.loadMore).length;
        new Array(length).fill(" ").forEach((d, i) => {
          agHelper.GetNClick(oneClickBindingLocator.loadMore, i);
        });
      }
    });

    agHelper.GetNClick(
      oneClickBindingLocator.datasourceSelector("myinvalidds"),
    );
    agHelper.AssertElementExist(
      oneClickBindingLocator.tableError(
        "Appsmith server timed out when fetching structure. Please reach out to appsmith customer support to resolve this.",
      ),
    );
  });

  it("should check that load more options and search", () => {
    propPane.MoveToTab("Style");

    propPane.MoveToTab("Content");

    entityExplorer.NavigateToSwitcher("Explorer");

    [1, 2, 3].forEach(() => {
      apiPage.CreateAndFillApi("http://www.example.com");
    });

    entityExplorer.NavigateToSwitcher("Widgets");

    entityExplorer.SelectEntityByName("Table1");

    agHelper.GetNClick(oneClickBindingLocator.datasourceDropdownSelector);

    cy.get(oneClickBindingLocator.datasourceQuerySelector()).then(($ele) => {
      expect($ele.length).equals(2);
    });

    agHelper.AssertElementExist(oneClickBindingLocator.loadMore);

    agHelper.GetNClick(oneClickBindingLocator.loadMore, 0);

    cy.get(oneClickBindingLocator.datasourceQuerySelector()).then(($ele) => {
      expect($ele.length).greaterThan(2);
    });

    cy.get(oneClickBindingLocator.datasourceSelector()).then(($ele) => {
      expect($ele.length).equals(2);
    });

    agHelper.AssertElementExist(oneClickBindingLocator.loadMore);

    agHelper.GetNClick(oneClickBindingLocator.loadMore, 0);

    cy.get(oneClickBindingLocator.datasourceSelector()).then(($ele) => {
      expect($ele.length).greaterThan(2);
    });
  });

  it("should test the search input function", () => {
    cy.get(oneClickBindingLocator.datasourceQuerySelector()).then(($ele) => {
      expect($ele.length).greaterThan(2);
    });

    agHelper.TypeText(oneClickBindingLocator.datasourceSearch, "Api1");

    cy.get(oneClickBindingLocator.datasourceQuerySelector()).then(($ele) => {
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

    //

    cy.get(oneClickBindingLocator.datasourceSelector()).then(($ele) => {
      expect($ele.length).greaterThan(2);
    });

    agHelper.TypeText(oneClickBindingLocator.datasourceSearch, "myinvalidds");

    cy.get(oneClickBindingLocator.datasourceSelector()).then(($ele) => {
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
