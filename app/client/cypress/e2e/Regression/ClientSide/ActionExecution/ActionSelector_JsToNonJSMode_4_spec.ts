import {
  agHelper,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS to non-JS mode in Action Selector",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    });

    it("1. Bug 23167 - Message field in PostMessage should accept all type of values", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);

      propPane.EnterJSContext(
        "onClick",
        "{{postWindowMessage(Input1.text, 'window', '*')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNAssertElementText(
        propPane._actionCard,
        "Post message{{Input1.text}}",
        "have.text",
        0,
      );
      agHelper.GetNClick(propPane._actionCard, 0);

      agHelper.ValidateCodeEditorContent(
        propPane._textView,
        "{{Input1.text}}window*",
      );

      propPane.EnterJSContext(
        "onClick",
        "{{postWindowMessage({ x: Input1.text }, 'window', '*')}}",
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.ValidateCodeEditorContent(
        propPane._textView,
        "{{{\n x: Input1.text \n}}}window*",
      );
    });

    it("2. should logout user successfully using global logoutUser function and should redirect to the same app on login", () => {
      let applicationUrl = "";
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{logoutUser()}}", true, false);
      cy.location().then((loc) => {
        applicationUrl = loc.pathname;
        propPane.ToggleJSMode("onClick", false);
        propPane.UpdatePropertyFieldValue("Label", "");
        propPane.TypeTextIntoField("Label", "LOGOUT GLOBAL");
        agHelper.ClickButton("LOGOUT GLOBAL");
        cy.location().should((loc) => {
          expect(loc.pathname).to.eq("/user/login");
        });
        cy.LoginFromAPI(
          Cypress.env("USERNAME"),
          Cypress.env("PASSWORD"),
          applicationUrl,
        );
        agHelper.AssertElementVisibility(
          locators._buttonByText("LOGOUT GLOBAL"),
        );
      });
    });

    it("3. should logout user successfully using global logoutUser function and should redirect to the url provided with multiple query params", () => {
      let applicationUrl = "";
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        "{{logoutUser('/abc/def?test1=123&test2=456')}}",
        true,
        false,
      );
      cy.location().then((loc) => {
        propPane.ToggleJSMode("onClick", false);
        propPane.UpdatePropertyFieldValue("Label", "");
        propPane.TypeTextIntoField("Label", "LOGOUT GLOBAL");
        agHelper.ClickButton("LOGOUT GLOBAL");
        cy.location().should((loc) => {
          expect(loc.pathname).to.eq("/user/login");
          expect(loc.search).to.eq(
            "?redirectUrl=" +
              encodeURIComponent("/abc/def?test1=123&test2=456"),
          );
        });
      });
    });
  },
);
