import { ObjectsRegistry } from "../Objects/Registry";

export class DesignSystem {
  public TextInput = new TextInput();
}

class TextInput {
  private agHelper = ObjectsRegistry.AggregateHelper;

  public errorMessageSelector = (fieldId: string) => {
    fieldId = fieldId[0] === "#" ? fieldId.slice(1, fieldId.length) : fieldId;
    return `//input[@id='${fieldId}']/following-sibling::div/span`;
  };

  public tryValueAndAssertErrorMessage(
    fieldId: string,
    newValue: string,
    errorMessage: string,
    resetValue = true,
  ) {
    this.agHelper.InvokeVal(fieldId).then((currentValue) => {
      if (newValue.length === 0) this.agHelper.ClearTextField(fieldId);
      else
        this.agHelper.RemoveCharsNType(
          fieldId,
          (currentValue as string).length,
          newValue,
        );
      this.agHelper.AssertText(
        this.errorMessageSelector(fieldId),
        "text",
        errorMessage,
      );
      if (resetValue) {
        this.agHelper.RemoveCharsNType(
          fieldId,
          newValue.length,
          currentValue as string,
        );
      }
    });
  }
}
