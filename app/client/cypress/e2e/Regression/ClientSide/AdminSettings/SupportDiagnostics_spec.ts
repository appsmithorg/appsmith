import {
  adminSettings,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import AdminsSettings from "../../../../locators/AdminsSettings";
import {
  createMessage,
  SUPPORT_DIAGNOSTICS,
} from "../../../../../src/ce/constants/messages";

const SECTION_IDS = [
  "INSTANCE",
  "DEPLOYMENT",
  "FEATURE_FLAGS",
  "APPLICATIONS",
  "DATASOURCES",
  "WORKFLOWS",
  "IDENTITY",
  "AI_MCP",
  "HEALTH",
];
const ZIP_GLOB = "appsmith-support-diagnostics-*.zip";
const FIND_ATTEMPTS = 40;

describe(
  "Admin Settings - Support diagnostics page",
  { tags: ["@tag.Settings"] },
  () => {
    const downloadsFolder = Cypress.config("downloadsFolder");

    function interceptSupportApis() {
      cy.intercept("GET", "**/api/v1/admin/support/diagnostics/sections").as(
        "sections",
      );
      cy.intercept(
        "POST",
        "**/api/v1/admin/support/diagnostics/sections/*/collect",
      ).as("collect");
      cy.intercept("POST", "**/api/v1/admin/support/diagnostics/downloads").as(
        "download",
      );
    }

    // Opens the page and waits for the section list and for one collect call
    // per section the server reports as NOT_COLLECTED.
    function openSupportPageAndWaitForCollects() {
      adminSettings.NavigateToAdminSettings();
      agHelper.GetNClick(AdminsSettings.supportDiagnosticsTab);

      return cy.wait("@sections").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body.responseMeta.success).to.equal(true);

        const sections = interception.response?.body.data.sections;

        expect(sections, "sections array").to.be.an("array");

        const notCollected = sections.filter(
          (section: { status: string }) => section.status === "NOT_COLLECTED",
        ).length;

        expect(notCollected, "NOT_COLLECTED count").to.be.a("number");

        Cypress._.times(notCollected, () => {
          cy.wait("@collect").then((collectInterception) => {
            expect(collectInterception.response?.statusCode).to.equal(200);
            expect(
              collectInterception.response?.body.responseMeta.success,
            ).to.equal(true);
          });
        });
      });
    }

    // Looks for the downloaded ZIP by glob, retrying while the browser writes it.
    function findDownloadedZip(attempt = 0): Cypress.Chainable<string> {
      return cy
        .exec(`ls "${downloadsFolder}"/${ZIP_GLOB}`, {
          failOnNonZeroExit: false,
        })
        .then((result) => {
          const path = result.stdout.split("\n")[0];

          if (result.code === 0 && path) return cy.wrap(path);

          expect(attempt, "downloaded ZIP found").to.be.lessThan(FIND_ATTEMPTS);

          // Chrome writes a .crdownload first; the *.zip glob skips it.
          // 40 attempts x 250 ms is a budget of about 10 s.
          cy.wait(250); // eslint-disable-line cypress/no-unnecessary-waiting

          return findDownloadedZip(attempt + 1);
        });
    }

    beforeEach(() => {
      cy.exec(`rm -f "${downloadsFolder}"/${ZIP_GLOB}`, {
        failOnNonZeroExit: false,
      });
      interceptSupportApis();
    });

    it("1. Shows every section and collects the missing ones", () => {
      openSupportPageAndWaitForCollects();

      agHelper.AssertElementLength(AdminsSettings.supportDiagnosticsAnyCard, 9);
      SECTION_IDS.forEach((sectionId) => {
        agHelper.AssertElementVisibility(
          AdminsSettings.supportDiagnosticsCard(sectionId),
        );
      });
      cy.get(AdminsSettings.supportDiagnosticsAnyCard).should(
        "not.contain.text",
        createMessage(SUPPORT_DIAGNOSTICS.statusTags.collecting),
      );
    });

    it("2. Downloads a plain ZIP and records it", () => {
      openSupportPageAndWaitForCollects();

      cy.get(AdminsSettings.supportDiagnosticsDownload).should("be.enabled");
      agHelper.GetNClick(AdminsSettings.supportDiagnosticsDownload);

      cy.wait("@download").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body.responseMeta.success).to.equal(true);
      });

      findDownloadedZip().then((path) => {
        cy.readFile(path, "binary").then((content: string) => {
          expect(content.startsWith("PK\x03\x04")).to.equal(true);
        });
      });
    });

    it("3. Disables Download when no section is included", () => {
      openSupportPageAndWaitForCollects();

      agHelper.GetNClick(AdminsSettings.supportDiagnosticsClearAll);

      cy.get(AdminsSettings.supportDiagnosticsDownload).should("be.disabled");
      // The nine cards push the download panel below the fold of the
      // fixed-position settings area, so scroll it into view first.
      cy.get(AdminsSettings.supportDiagnosticsDownloadReason)
        .scrollIntoView()
        .should(($el) => {
          expect($el).to.be.visible;
          expect($el.text()).to.eq(
            createMessage(SUPPORT_DIAGNOSTICS.noneSelected),
          );
        });
    });
  },
);
