import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { useGroupedAddJsOperations } from "../../JS/hooks";

describe("useGroupedAddJsOperations", () => {
  it("returns an array of grouped operations", () => {
    const operations = useGroupedAddJsOperations();

    expect(operations).toHaveLength(1);

    // Check the properties of the operation
    const [group] = operations;

    // Ensure the operations array contains at least one operation
    expect(group.operations).toHaveLength(1);

    // Ensure blank JS item exist in the operatios
    expect(group.operations[0].title).toBe(
      createMessage(EDITOR_PANE_TEXTS.js_blank_object_item),
    );
  });
});
