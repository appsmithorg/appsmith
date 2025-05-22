import _ from "lodash";
import derivedProperty from "../../derived";

describe("getEditableCellValidity", () => {
  const { getEditableCellValidity } = derivedProperty;

  describe("1 when isAddRowInProgress is false", () => {
    it("1.1 should return empty object when editableCell is empty", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {},
            isAddRowInProgress: false,
          },
          null,
          _,
        ),
      ).toEqual({});
    });

    describe("1.2 validation rules", () => {
      it("1.2.1 should return true when validation is empty", () => {
        expect(
          getEditableCellValidity(
            {
              editableCell: {
                column: "step",
                value: "test",
              },
              primaryColumns: {
                step: {
                  columnType: "text",
                  alias: "step",
                  validation: {},
                },
              },
            },
            null,
            _,
          ),
        ).toEqual({ step: true });
      });

      it("1.2.2 should handle required field validation", () => {
        // Required field with value
        const props = {
          editableCell: {
            column: "step",
            value: "test",
          },
          primaryColumns: {
            step: {
              columnType: "text",
              alias: "step",
              validation: {
                isColumnEditableCellRequired: true,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });

        // Required field without value
        props.editableCell.value = "";
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });

        // Not required field without value
        props.primaryColumns.step.validation.isColumnEditableCellRequired = false;
        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });
      });

      it("1.2.3 should handle editable column when isColumnEditableCellValid is provided", () => {
        const props = {
          editableCell: {
            column: "step",
            value: null,
          },
          primaryColumns: {
            step: {
              columnType: "text",
              alias: "step",
              validation: {
                isColumnEditableCellValid: true,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });

        props.primaryColumns.step.validation.isColumnEditableCellValid = false;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });
      });

      it("1.2.4 should handle regex validation", () => {
        // Matching regex
        const props = {
          editableCell: {
            column: "step",
            value: "#1",
          },
          primaryColumns: {
            step: {
              columnType: "text",
              alias: "step",
              validation: {
                regex: "^#1$",
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });
        // Non-matching regex
        props.editableCell.value = "test";
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });
      });

      it("1.2.5 should handle number/currency column validation", () => {
        // Min validation
        const props = {
          editableCell: {
            column: "amount",
            value: 1,
          },
          primaryColumns: {
            amount: {
              columnType: "number",
              alias: "amount",
              validation: {
                min: 0,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: true,
        });

        props.editableCell.value = -1;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: false,
        });

        delete props.primaryColumns.amount.validation.min;

        // Max validation
        props.primaryColumns.amount.validation.max = 5;
        props.editableCell.value = 4;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: true,
        });

        props.editableCell.value = 6;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: false,
        });
      });

      it("1.2.6 should handle combined validation rules", () => {
        const props = {
          editableCell: {
            column: "step",
            value: "#1",
          },
          primaryColumns: {
            step: {
              columnType: "text",
              alias: "step",
              validation: {
                isColumnEditableCellValid: false,
                regex: "^#1$",
                isColumnEditableCellRequired: false,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });

        props.primaryColumns.step.validation.isColumnEditableCellValid = true;
        props.editableCell.value = "#1";
        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });

        props.editableCell.value = "#2";
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });
      });
    });
  });

  describe("2 when isAddRowInProgress is true", () => {
    it("2.1 should validate only editable columns", () => {
      const props = {
        isAddRowInProgress: true,
        editableCell: {},
        newRow: {
          step: "#1",
          task: "test",
        },
        primaryColumns: {
          step: {
            isEditable: true,
            columnType: "text",
            alias: "step",
            validation: {},
          },
          task: {
            columnType: "text",
            alias: "task",
            validation: {},
          },
        },
      };

      expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });
      props.primaryColumns.task.isEditable = true;
      expect(getEditableCellValidity(props, null, _)).toEqual({
        step: true,
        task: true,
      });
    });

    describe("2.2 validation rules", () => {
      it("2.2.1 should return true when validation is empty", () => {
        expect(
          getEditableCellValidity(
            {
              isAddRowInProgress: true,
              editableCell: {},
              newRow: {
                step: "test",
                task: "test",
              },
              primaryColumns: {
                step: {
                  isEditable: true,
                  columnType: "text",
                  alias: "step",
                  validation: {},
                },
                task: {
                  isEditable: true,
                  columnType: "text",
                  alias: "task",
                  validation: {},
                },
              },
            },
            null,
            _,
          ),
        ).toEqual({ step: true, task: true });
      });

      it("2.2.2 should handle required field validation", () => {
        const props = {
          isAddRowInProgress: true,
          editableCell: {},
          newRow: {
            step: "test",
          },
          primaryColumns: {
            step: {
              isEditable: true,
              columnType: "text",
              alias: "step",
              validation: {
                isColumnEditableCellRequired: true,
              },
            },
          },
        };

        // Required field with value
        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });

        // Required field without value
        props.newRow.step = "";
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });

        // Not required field without value
        props.primaryColumns.step.validation.isColumnEditableCellRequired = false;
        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });
      });

      it("2.2.3 should handle editable column when isColumnEditableCellValid is provided", () => {
        const props = {
          isAddRowInProgress: true,
          editableCell: {},
          newRow: {
            step: null,
          },
          primaryColumns: {
            step: {
              isEditable: true,
              columnType: "text",
              alias: "step",
              validation: {
                isColumnEditableCellValid: true,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({ step: true });

        props.primaryColumns.step.validation.isColumnEditableCellValid = false;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          step: false,
        });
      });

      it("2.2.4 should handle regex validation", () => {
        // Matching regex
        expect(
          getEditableCellValidity(
            {
              isAddRowInProgress: true,
              editableCell: {},
              newRow: {
                step: "#1",
              },
              primaryColumns: {
                step: {
                  isEditable: true,
                  columnType: "text",
                  alias: "step",
                  validation: {
                    regex: "^#1$",
                  },
                },
              },
            },
            null,
            _,
          ),
        ).toEqual({ step: true });

        // Non-matching regex
        expect(
          getEditableCellValidity(
            {
              isAddRowInProgress: true,
              editableCell: {},
              newRow: {
                step: "test",
              },
              primaryColumns: {
                step: {
                  isEditable: true,
                  columnType: "text",
                  alias: "step",
                  validation: {
                    regex: "^#1$",
                  },
                },
              },
            },
            null,
            _,
          ),
        ).toEqual({ step: false });
      });

      it("2.2.5 should handle number/currency column validation", () => {
        // Min validation
        const props = {
          isAddRowInProgress: true,
          editableCell: {},
          newRow: {
            amount: 1,
          },
          primaryColumns: {
            amount: {
              isEditable: true,
              columnType: "number",
              alias: "amount",
              validation: {
                min: 0,
              },
            },
          },
        };

        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: true,
        });

        props.newRow.amount = -1;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: false,
        });

        delete props.primaryColumns.amount.validation.min;

        // Max validation
        props.primaryColumns.amount.validation.max = 5;
        props.newRow.amount = 4;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: true,
        });

        props.newRow.amount = 6;
        expect(getEditableCellValidity(props, null, _)).toEqual({
          amount: false,
        });
      });

      it("2.2.6 should handle multiple columns validation", () => {
        expect(
          getEditableCellValidity(
            {
              isAddRowInProgress: true,
              editableCell: {},
              newRow: {
                step: "#1",
                task: "test",
              },
              primaryColumns: {
                step: {
                  isEditable: true,
                  columnType: "text",
                  alias: "step",
                  validation: {
                    isColumnEditableCellValid: true,
                    regex: "^#1$",
                    isColumnEditableCellRequired: true,
                  },
                },
                task: {
                  isEditable: true,
                  columnType: "text",
                  alias: "task",
                  validation: {
                    isColumnEditableCellValid: true,
                    regex: "test",
                    isColumnEditableCellRequired: true,
                  },
                },
              },
            },
            null,
            _,
          ),
        ).toEqual({ step: true, task: true });
      });
    });
  });
});
