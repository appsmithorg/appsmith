import locators from "../../../../locators/AuditLogsLocators";
import {
  userEvents,
  workspaceEvents,
} from "../../../../fixtures/AuditLogsdata/misc";
import homePage from "../../../../locators/HomePage";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import widgets from "../../../../locators/Widgets.json";
import explorer from "../../../../locators/explorerlocators.json";

const propPane = ObjectsRegistry.PropertyPane;
const jsEditor = ObjectsRegistry.JSEditor;

let funcName = "";

describe("Audit logs", () => {
  before(() => {
    cy.visit("/applications");
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      const defaultWorkspaceName = interception.response.body.data.name;
      for (let i = 0; i < 1; i++) {
        cy.generateUUID().then((uid) => {
          cy.CreateAppForWorkspace(defaultWorkspaceName, uid);
          for (let j = 0; j < 1; j++) {
            const page = `${uid}_Page${j}`;
            cy.Createpage(page);

            if (j === 0) {
              funcName = `myFunc_${uid}`;
              const JS_OBJECT_BODY = `export default {
                ${funcName}: () => {
                  showAlert("Function executed");
                    }
                }`;
              jsEditor.CreateJSObject(JS_OBJECT_BODY, {
                paste: true,
                completeReplace: true,
                toRun: false,
                prettify: false,
                shouldCreateNewJSObj: true,
              });

              cy.wait(1000);
              cy.get(explorer.addWidget).click();

              cy.dragAndDropToCanvas("buttonwidget", { x: 400, y: 550 });

              cy.wait(1000);

              cy.openPropertyPane("buttonwidget");

              cy.get(widgets.toggleOnClick).click();
              cy.updateCodeInput(
                ".t--property-control-onclick",
                `{{JSObject1.${funcName}()}}`,
              );

              propPane.TypeTextIntoField("Label", "Run Func");

              cy.get(widgets.widgetBtn)
                .contains("Run Func")
                .click({ force: true });
            }

            cy.Deletepage(page);
          }
          cy.DeleteApp(uid);
        });
        cy.visit("/applications");
      }
    });
  });

  it("1. superuser should be able to see audit logs", () => {
    cy.LogOut();
    cy.LoginFromAPI(Cypress.env("USERNAME"), Cypress.env("PASSWORD"));
    cy.get(locators.AdminSettingsEntryLink).should("be.visible");
    cy.get(locators.AdminSettingsEntryLink).click();
    cy.url().should("contain", "/settings/general");
    cy.get(locators.LeftPaneAuditLogsLink).should("be.visible");
    cy.get(locators.LeftPaneAuditLogsLink).click();
    cy.wait(2000);
    /* visibility tests */
    /* heading */
    cy.get(locators.Heading).should("be.visible");
    /* Clear button doesn't exist yet */
    cy.get(locators.ClearButton).should("not.exist");
    /* Refresh button should be visible */
    cy.get(locators.RefreshButton).should("be.visible");

    /* filters should exist */
    cy.get(locators.FiltersContainer).then(() => {
      cy.get(locators.EventFilterContainer)
        .should("be.visible")
        .find(locators.EventFilterDropdown)
        .should("be.visible");

      cy.get(locators.EmailFilterContainer)
        .should("be.visible")
        .find(locators.EmailFilterDropdown)
        .should("be.visible");

      cy.get(locators.ResourceIdFilterContainer)
        .should("be.visible")
        .find(locators.ResourceIdFilterText)
        .should("be.visible");

      cy.get(locators.DateFilterContainer).should("be.visible");
    });

    cy.get(locators.TableContainer)
      .should("exist")
      .then(() => {
        cy.get(locators.TableHeadContainer)
          .should("be.visible")
          .then(() => {
            cy.get(locators.TableHeadEventCol).should("be.visible");
            cy.get(locators.TableHeadUserCol).should("be.visible");
            cy.get(locators.TableHeadDateCol).should("be.visible");
          });
      });

    cy.get(locators.EventFilterContainer).click();
    /* Starting with Event Dropdown */

    cy.get(locators.SelectSearchBox).should("be.visible");
    cy.get(locators.OptionsInnerWrapper).should("be.visible");
    cy.get(locators.SelectSearchBox)
      .first()
      .type("random")
      .then(() => {
        cy.get(locators.OptionsEmpty)
          .should("exist")
          .should("have.text", "Not Found");
      });

    cy.get(locators.SelectSearchBox)
      .first()
      .clear()
      .then(() => {
        cy.get(locators.OptionsInnerWrapper).children().should("exist");
      });

    cy.get(locators.SelectSearchBox)
      .first()
      .clear()
      .type("user")
      .then(() => {
        cy.get(locators.OptionsInnerWrapper)
          .children(/* All "user" related options */)
          .should("have.length", userEvents.length)
          .eq(5)
          .should("have.text", userEvents[0].label)
          .next()
          .should("have.text", userEvents[1].label)
          .click(/* Clicking user logged in */);

        cy.get(".rc-select-item-option-selected").should("have.length", 1);

        cy.url()
          .should("include", "events=")
          .should("include", userEvents[1].value.toLowerCase())
          .should("include", "sort=DESC");

        cy.get(locators.RowsContainer)
          .children()
          .should("have.length.greaterThan", 1)
          .first()
          .children()
          .then((firstRow) => {
            /* The latest action that happens is that USERNAME logs in */
            /* First description contains `logs[n].user.name logged in`*/
            cy.wrap(firstRow)
              .children()
              .should("have.length", 3)
              .first()
              .text()
              .should("contain.text", "logged in");

            cy.wrap(firstRow)
              .children()
              .eq(1)
              .then((email) => {
                cy.wrap(email)
                  .contains(Cypress.env("USERNAME").substr(0, 10), {
                    matchCase: false,
                  })
                  .click()
                  .then(() => {
                    cy.get(locators.EmailFilterDropdown)
                      .find(locators.Renderer)
                      .eq(2)
                      .then((renderer) => {
                        cy.wrap(renderer).contains(
                          Cypress.env("USERNAME").substr(0, 10),
                          {
                            matchCase: false,
                          },
                        );
                      });
                  });

                cy.url()
                  .should("include", "emails=")
                  .should("include", Cypress.env("USERNAME").toLowerCase())
                  .should("include", "sort=DESC");
              });
          });
      });

    cy.get(locators.ClearButton).should("be.visible").click();

    cy.url()
      .should("not.include", "emails=")
      .should("not.include", "events=")
      .should("not.include", "resourceId=")
      .should("include", "sort=DESC");
  });

  it("2. url to filters are populated properly", () => {
    /* Check url to filters tests */
    cy.visit("/settings/audit-logs?sort=DESC&days=0").then(() => {
      cy.wait(2000);
      cy.get(locators.ClearButton).should("not.exist");
    });

    cy.visit("/settings/audit-logs?sort=ASC&days=1").then(() => {
      cy.wait(2000);
      cy.get(locators.ClearButton).should("be.visible");
    });
  });

  /* This will come back after we learn how to generate every event, fast.
   * Need to generate events very fast or store them in a file
   * and fake the response.
   */
  // it("loads more logs on scroll", () => {
  //   /* Slowly, like a user would scroll */
  //   cy.visit("/settings/audit-logs").then(() => {
  //     cy.get(locators.RowsContainer)
  //       .children()
  //       .should("have.length", 200);
  //     cy.get(locators.EndMarker).scrollIntoView({ duration: 5000 });
  //     cy.wait(4000);
  //     cy.get(locators.RowsContainer)
  //       .children()
  //       .should("have.length.greaterThan", 200);
  //   });
  //   //cy.wait(4000);
  //   /* Fast, like a user would press pageEnd button */
  //   // cy.visit("/settings/audit-logs").then(() => {
  //   //   cy.get(locators.RowsContainer)
  //   //     .children()
  //   //     .should("have.length", 200);
  //   //   cy.get(locators.EndMarker).scrollIntoView();
  //   //   cy.wait(4000);
  //   //   cy.get(locators.RowsContainer)
  //   //     .children()
  //   //     .should("have.length.greaterThan", 200);
  //   // });
  // });

  it("3. test case: event dropdown and workspace deletion log", () => {
    let defaultWorkspaceName;
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      defaultWorkspaceName = interception.response.body.data.name;
      cy.openWorkspaceOptionsPopup(defaultWorkspaceName);
      cy.get(homePage.workspaceNamePopoverContent)
        .last()
        .find(".ads-v2-menu__menu-item")
        .contains("Delete workspace")
        .click();
      cy.contains("Are you sure").click();
      cy.wait("@deleteWorkspaceApiCall").then((httpResponse) => {
        expect(httpResponse.status).to.equal(200);
      });
    });

    cy.visit("/settings/audit-logs").then(() => {
      cy.get(locators.EventFilterContainer).should("be.visible").click();
      /* Starting with Event Dropdown */
      cy.get(locators.OptionsInnerWrapper)
        .should("be.visible")
        .children()
        .should("have.length.greaterThan", 26);

      cy.get(locators.SelectSearchBox)
        .first()
        .type("workspace")
        .then(() => {
          let numberOfResults = 0;
          cy.intercept(
            "GET",
            "/api/v1/audit-logs/logs?events=workspace.deleted",
          ).as("workspaceDeletedEventSelection");
          cy.get(locators.OptionsInnerWrapper)
            .children()
            .should("have.length", workspaceEvents.length)
            .eq(1)
            .then(($el) => {
              cy.wrap($el)
                .should("have.text", workspaceEvents[1].label)
                .click();
              cy.wait(4000);
              cy.wait("@workspaceDeletedEventSelection")
                .its("response.body")
                .then((body) => {
                  numberOfResults = body.data.length;
                  cy.get(locators.Heading).click();
                  cy.get(locators.RowsContainer)
                    .children()
                    .should("have.length", numberOfResults);

                  cy.url().should("include", "events=workspace.deleted");

                  cy.get(locators.ClearButton).should("be.visible").click();

                  cy.url()
                    .should("not.include", "emails=")
                    .should("not.include", "events=")
                    .should("not.include", "resourceId=")
                    .should("include", "sort=DESC");
                });
            });
        });
    });
  });

  it("4. workspace and application creation and deployment logs", () => {
    let applicationName = "";
    let applicationId = "";
    let defaultWorkspaceName = "";
    cy.NavigateToHome();
    cy.createWorkspace();
    cy.wait("@createWorkspace").then((interception) => {
      defaultWorkspaceName = interception.response.body.data.name;
      cy.generateUUID().then((uid) => {
        cy.CreateAppForWorkspace(defaultWorkspaceName, uid);
        applicationName = uid;
        cy.get("@currentApplicationId").then(
          (currentAppId) => (applicationId = currentAppId),
        );
      });
    });

    /* checking audit logs to see workspace and application creation */
    cy.visit("/settings/audit-logs").then(() => {
      cy.get(locators.RowsContainer)
        .children()
        .should("have.length.greaterThan", 1)
        .first()
        .children()
        .then((firstRow) => {
          cy.wrap(firstRow)
            .children()
            .should("have.length", 3)
            .first()
            .text()
            .should(
              "contain.text",
              `${applicationName} updatedin ${defaultWorkspaceName}`,
            );

          cy.get(locators.RowsContainer)
            .children()
            .eq(1)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should("contain.text", `Page1 updatedin Untitled application 1`);

          cy.get(locators.RowsContainer)
            .children()
            .eq(2)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should("contain.text", `Page1 viewedin Untitled application 1`);

          cy.get(locators.RowsContainer)
            .children()
            .eq(3)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should("contain.text", `Page1 viewedin Untitled application 1`);

          cy.get(locators.RowsContainer)
            .children()
            .eq(4)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should(
              "contain.text",
              `Untitled application 1 deployedin ${defaultWorkspaceName}`,
            );

          cy.get(locators.RowsContainer)
            .children()
            .eq(5)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should("contain.text", `Page1 createdin Untitled application 1`);

          cy.get(locators.RowsContainer)
            .children()
            .eq(6)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should(
              "contain.text",
              `Untitled application 1 createdin ${defaultWorkspaceName}`,
            );

          cy.get(locators.RowsContainer)
            .children()
            .eq(7)
            .children()
            .eq(0)
            .children()
            .eq(0)
            .should("contain.text", `${defaultWorkspaceName} created`);

          cy.wrap(firstRow)
            .children()
            .eq(1)
            .then((email) => {
              cy.wrap(email).contains(Cypress.env("USERNAME").substr(0, 10), {
                matchCase: false,
              });
            });
        });
    });
  });

  it("5. Function invocation events", () => {
    cy.visit("settings/audit-logs?events=query.executed&sort=DESC").then(() => {
      cy.wait(2000);
      cy.get("[data-testid='t--audit-logs-table-row-description-content']")
        .first()
        .scrollIntoView()
        .contains(funcName);
    });
  });
});
