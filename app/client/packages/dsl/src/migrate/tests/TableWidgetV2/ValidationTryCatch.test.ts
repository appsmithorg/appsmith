import { migrateTableWidgetV2ValidationTryCatch } from "../../migrations/090-migrate-table-widget-v2-validation-try-catch";
import {
  validationTryCatchInput,
  validationTryCatchOutput,
} from "./DSLs/ValidationTryCatchDSLs";

describe("migrateTableWidgetV2ValidationTryCatch", () => {
  it("should add try-catch blocks to table compute value bindings", () => {
    const migratedDSL = migrateTableWidgetV2ValidationTryCatch(
      validationTryCatchInput,
    );

    expect(migratedDSL).toEqual(validationTryCatchOutput);
  });
});
