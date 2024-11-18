import {
  homePage,
  partialImportExport,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Partial import App",
  { tags: ["@tag.ImportExport", "@tag.Git"] },
  () => {
    beforeEach(() => {
      partialImportExport.OpenImportModal();
    });

    it("1. Verify Importing App into Page shows error message for incompatible json file ", () => {
      homePage.ImportApp("PartialImportAppNegative.json", "", true);
      agHelper.ValidateToastMessage(
        "Unable to import artifact in workspace The file is not compatible with the current partial import operation. Please check the file and try again.. {1}",
      );
    });
  },
);
