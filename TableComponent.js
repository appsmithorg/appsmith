class TableComponent {
  constructor() {
    this.selectedRows = new Map(); // Store selections by unique row ID instead of index
    this.visibleData = []; // Currently visible/loaded rows
    this.totalRows = 0; // Total number of rows available
    this.pageSize = 50; // Number of rows to load per page
    this.currentPage = 1;
    this.isLoading = false;
    this.handleScroll = debounce(this.handleScroll.bind(this), 150);
    this.container.addEventListener("scroll", this.handleScroll);
  }

  handleRowSelection(rowData, isSelected) {
    // Use a unique identifier from your data instead of index
    const rowId = rowData.id || generateUniqueId(rowData);

    if (isSelected) {
      this.selectedRows.set(rowId, rowData);
    } else {
      this.selectedRows.delete(rowId);
    }

    // Trigger selection change event
    this.onSelectionChange(Array.from(this.selectedRows.values()));
  }

  getSelectedRow() {
    // Return the last selected row
    const selections = Array.from(this.selectedRows.values());
    return selections[selections.length - 1];
  }

  getSelectedRows() {
    return Array.from(this.selectedRows.values());
  }

  getTriggeredRow(event) {
    // Get the actual row data instead of relying on index
    const rowElement = event.target.closest("[data-row-id]");
    const rowId = rowElement?.dataset.rowId;
    return this.visibleData.find((row) => row.id === rowId);
  }

  async handleScroll(event) {
    const { scrollTop, scrollHeight, clientHeight } = event.target;

    // Check if we're near the bottom (e.g., 80% scrolled)
    if (scrollTop + clientHeight >= scrollHeight * 0.8) {
      await this.loadMoreData();
    }
  }

  async loadMoreData() {
    if (this.isLoading || this.visibleData.length >= this.totalRows) {
      return;
    }

    this.isLoading = true;

    try {
      const newData = await this.fetchData(this.currentPage + 1);
      this.currentPage += 1;

      // Append new data while maintaining selection states
      this.visibleData = [...this.visibleData, ...newData];

      // Update row rendering while preserving selections
      this.renderRows();
    } finally {
      this.isLoading = false;
    }
  }

  renderRows() {
    return this.visibleData
      .map((rowData) => {
        const rowId = rowData.id || generateUniqueId(rowData);
        const isSelected = this.selectedRows.has(rowId);

        return `
        <tr 
          data-row-id="${rowId}"
          class="${isSelected ? "selected" : ""}"
          onclick="handleRowSelection(${JSON.stringify(
            rowData
          )}, !${isSelected})"
        >
          ${this.renderCells(rowData)}
        </tr>
      `;
      })
      .join("");
  }

  getAbsoluteIndex(visibleIndex) {
    return (this.currentPage - 1) * this.pageSize + visibleIndex;
  }

  getVisibleIndex(absoluteIndex) {
    return absoluteIndex - (this.currentPage - 1) * this.pageSize;
  }

  async fetchData(page) {
    try {
      const response = await fetch(
        `/api/data?page=${page}&pageSize=${this.pageSize}`
      );
      if (!response.ok) throw new Error("Failed to fetch data");
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

  renderLoadingState() {
    return `
      <tr class="loading-row">
        <td colspan="100%">Loading more data...</td>
      </tr>
    `;
  }
}
