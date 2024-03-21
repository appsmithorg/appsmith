import { useGroupedAddJsOperations } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";

describe("useGroupedAddJsOperations", () => {
  it("returns an array of grouped operations", () => {
    const operations = useGroupedAddJsOperations();

    expect(operations).toHaveLength(1);

    // Check the properties of the operation
    const [group] = operations;

    // Ensure the operations array contains at least one operation
    expect(group.operations).toHaveLength(1);
  });
});
