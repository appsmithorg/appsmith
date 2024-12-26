import _ from "lodash";
import derivedProperty from "../../derived";

describe("getEditableCellValidity", () => {
  const { getEditableCellValidity } = derivedProperty;

  it("should test that its returns empty object when editableCell is empty and isAddRowInProgess is false", () => {
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

  describe("should test that it validates the editableColumn against all the validation properties", () => {
    it("should return true for editable column when validation is empty", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
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

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "123",
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

    it("should return true for editable column when isColumnEditableCellRequired is off and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: undefined,
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: null,
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable column when isColumnEditableCellValid is true", () => {
      expect(
        getEditableCellValidity(
          {
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
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when isColumnEditableCellValid is false", () => {
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
                validation: {
                  isColumnEditableCellValid: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when regex is matching", () => {
      expect(
        getEditableCellValidity(
          {
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
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

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
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when regex is not matching", () => {
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

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                columnType: "text",
                alias: "step",
                validation: {
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return false for editable column when isColumnEditableCellRequired is true and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "",
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
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when isColumnEditableCellRequired and there is value", () => {
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
                validation: {
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable column when value is above min", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 1,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when value is below min", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: -1,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when value is below max", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 2,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable column when value is above max", () => {
      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: 6,
            },
            primaryColumns: {
              step: {
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable column when value is matching all the validation criteria", () => {
      expect(
        getEditableCellValidity(
          {
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
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

      expect(
        getEditableCellValidity(
          {
            editableCell: {
              column: "step",
              value: "#1",
            },
            primaryColumns: {
              step: {
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });
  });

  describe("should test that it validates the new row against all the validation properties", () => {
    it("should check that only editable columns are present in the validation object", () => {
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
                validation: {},
              },
              task: {
                columnType: "text",
                alias: "task",
                validation: {},
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

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
      ).toEqual({ task: true });

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

    it("should return true for editable columns when validation is empty", () => {
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

    it("should return true for editable columns when isColumnEditableCellRequired is off and there is no value", () => {
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
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: undefined,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "text",
                alias: "step",
                validation: {
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

      expect(
        getEditableCellValidity(
          {
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
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable columns when isColumnEditableCellValid is true", () => {
      expect(
        getEditableCellValidity(
          {
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
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when isColumnEditableCellValid is false", () => {
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
                  isColumnEditableCellValid: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when regex is matching", () => {
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
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when regex is not matching", () => {
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
                  regex: "^test$",
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return false for editable columns when isColumnEditableCellRequired is true and there is no value", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: "",
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
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when isColumnEditableCellRequired and there is value", () => {
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
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return true for editable columns when value is above min", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 1,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when value is below min", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: -1,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  min: 0,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when value is below max", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 2,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });
    });

    it("should return false for editable columns when value is above max", () => {
      expect(
        getEditableCellValidity(
          {
            isAddRowInProgress: true,
            editableCell: {},
            newRow: {
              step: 6,
            },
            primaryColumns: {
              step: {
                isEditable: true,
                columnType: "number",
                alias: "step",
                validation: {
                  max: 5,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should return true for editable columns when value is matching all the validation criteria", () => {
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
                  isColumnEditableCellValid: false,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

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
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

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
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#1$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: true });

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
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: true,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });

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
                alias: "step",
                columnType: "text",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "^#2$",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false });
    });

    it("should check that more than one column is validated at the same time", () => {
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
                  isColumnEditableCellValid: false,
                  regex: "^#1$",
                  isColumnEditableCellRequired: false,
                },
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "test",
                  isColumnEditableCellRequired: false,
                },
              },
            },
          },
          null,
          _,
        ),
      ).toEqual({ step: false, task: true });

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
                  isColumnEditableCellRequired: false,
                },
              },
              task: {
                isEditable: true,
                columnType: "text",
                alias: "task",
                validation: {
                  isColumnEditableCellValid: true,
                  regex: "test",
                  isColumnEditableCellRequired: false,
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
