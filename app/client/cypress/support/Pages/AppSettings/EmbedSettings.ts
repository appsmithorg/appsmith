import { ObjectsRegistry } from "../../Objects/Registry";
export class EmbedSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;

  private locators = {
    _getDimensionInput: (prefix: string) => `.t--${prefix}-dimension input`,
    _snippet: "[data-cy='t--embed-snippet']",
  };

  public updateDimension(dimension: "H" | "W", value: string) {
    const input = this.locators._getDimensionInput(dimension);
    this.agHelper.RemoveCharsNType(input, -1, value);
  }

  public validateSnippet(width: string, height: string) {
    this.agHelper.GetNAssertElementText(
      this.locators._snippet,
      `width="${width}"`,
      "contain.text",
    );
    this.agHelper.GetNAssertElementText(
      this.locators._snippet,
      `height="${height}"`,
      "contain.text",
    );
  }
}
