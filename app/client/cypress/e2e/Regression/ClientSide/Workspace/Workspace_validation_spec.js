/// <reference types="Cypress" />

import homePage from "../../../../locators/HomePage";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Workspace name validation spec",
  { tags: ["@tag.Workspace", "@tag.AccessControl"] },
  function () {
    let workspaceId;
    let newWorkspaceName;
    it("1. create workspace with leading space validation", function () {
      _.homePage.NavigateToHome();
      cy.createWorkspace();

      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        _.homePage.OpenWorkspaceOptions(newWorkspaceName);
        cy.get(homePage.renameWorkspaceInput).should("be.visible").type(" ");
        cy.get(".error-message").should("be.visible");
        _.agHelper.ClickOutside();
      });
    });

    it("2. creates workspace and checks that workspace name is editable and create workspace with special characters validation", function () {
      cy.generateUUID().then((uid) => {
        workspaceId =
          "kadjhfkjadsjkfakjdscajdsnckjadsnckadsjcnanakdjsnckjdscnakjdscnnadjkncakjdsnckjadsnckajsdfkjadshfkjsdhfjkasdhfkjasdhfjkasdhjfasdjkfhjhdsfjhdsfjhadasdfasdfadsasdf" +
          uid;
        // create workspace with long name
        cy.createWorkspace();
        cy.wait("@createWorkspace").then((interception) => {
          newWorkspaceName = interception.response.body.data.name;
          _.homePage.RenameWorkspace(newWorkspaceName, workspaceId);
          // check if user icons exists in that workspace on homepage
          cy.get(homePage.workspaceList.concat(workspaceId).concat(")"))
            .scrollIntoView()
            .should("be.visible")
            .within(() => {
              cy.get(homePage.shareUserIcons).first().should("be.visible");
            });
          _.agHelper.ClickOutside();
          _.agHelper.GetNClick(homePage.optionsIcon, 0, true);
          _.agHelper.GetNClick(homePage.workspaceSettingOption, 0);
          _.agHelper.GetNClickByContains(
            "[data-testid=t--user-edit-tabs-wrapper]",
            "Members",
          );
          _.agHelper.AssertElementVisibility(_.homePage._inviteUserMembersPage);
          // checking parent's(<a></a>) since the child(<span>) inherits css from it
          cy.get(homePage.workspaceHeaderName).should(
            "have.css",
            "text-overflow",
            "ellipsis",
          );
        });
      });
      _.homePage.NavigateToHome();
      // create workspace with special character
      cy.createWorkspace();
      cy.wait("@createWorkspace").then((interception) => {
        newWorkspaceName = interception.response.body.data.name;
        _.agHelper.Sleep();
        _.homePage.RenameWorkspace(newWorkspaceName, "Test & Workspace");
      });
    });
  },
);
