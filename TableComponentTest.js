class TableComponentTest {
  static async runTests() {
    const tests = [
      this.testSelectionPersistence,
      this.testMultipleSelections,
      this.testTriggeredRow,
      this.testInfiniteScroll,
      this.testIndexConsistency,
    ];

    for (const test of tests) {
      try {
        await test();
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
      }
    }
  }

  static async testSelectionPersistence() {
    const table = new TableComponent();

    // Select a row
    const initialRow = { id: "1", name: "Test 1" };
    table.handleRowSelection(initialRow, true);

    // Simulate scroll and data load
    await table.loadMoreData();

    // Verify selection remains
    const selectedRow = table.getSelectedRow();
    if (selectedRow.id !== initialRow.id) {
      throw new Error("Selection was lost after scrolling");
    }
  }

  static async testMultipleSelections() {
    const table = new TableComponent();

    // Select multiple rows
    table.handleRowSelection({ id: "1", name: "Test 1" }, true);
    table.handleRowSelection({ id: "2", name: "Test 2" }, true);

    const selectedRows = table.getSelectedRows();
    if (selectedRows.length !== 2) {
      throw new Error("Multiple selections not working");
    }
  }

  static async testTriggeredRow() {
    const table = new TableComponent();
    table.visibleData = [
      { id: "1", name: "Test 1" },
      { id: "2", name: "Test 2" },
    ];

    const mockEvent = {
      target: {
        closest: () => ({ dataset: { rowId: "1" } }),
      },
    };

    const triggeredRow = table.getTriggeredRow(mockEvent);
    if (!triggeredRow || triggeredRow.id !== "1") {
      throw new Error("Triggered row identification failed");
    }
  }

  static async testInfiniteScroll() {
    const table = new TableComponent();

    // Mock scroll event
    const mockEvent = {
      target: {
        scrollTop: 800,
        scrollHeight: 1000,
        clientHeight: 200,
      },
    };

    const initialDataLength = table.visibleData.length;
    await table.handleScroll(mockEvent);

    if (table.visibleData.length <= initialDataLength) {
      throw new Error("Infinite scroll not loading more data");
    }
  }

  static async testIndexConsistency() {
    const table = new TableComponent();

    // Test absolute index calculation
    const visibleIndex = 5;
    const absoluteIndex = table.getAbsoluteIndex(visibleIndex);
    const backToVisible = table.getVisibleIndex(absoluteIndex);

    if (backToVisible !== visibleIndex) {
      throw new Error("Index translation is inconsistent");
    }
  }
}
