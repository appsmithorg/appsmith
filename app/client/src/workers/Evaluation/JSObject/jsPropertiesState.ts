import type { JSPropertyPosition, TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { set } from "lodash";

class JsPropertiesState {
  private jsPropertiesState: TJSPropertiesState = {};

  delete(jsObjectName: string) {
    delete this.jsPropertiesState[`${jsObjectName}`];
  }

  update(jsObjectName: string, properties: TParsedJSProperty[]) {
    for (const jsObjectProperty of properties) {
      const { key, position, rawContent, type } = jsObjectProperty;

      if (isJSFunctionProperty(jsObjectProperty)) {
        set(
          this.jsPropertiesState,
          `[${jsObjectName}.${jsObjectProperty.key}]`,
          {
            position: position,
            value: rawContent,
            isMarkedAsync: jsObjectProperty.isMarkedAsync,
          },
        );
      } else if (type !== "literal") {
        set(this.jsPropertiesState, `[${jsObjectName}.${key}]`, {
          position: position,
          value: rawContent,
        });
      }
    }
  }

  getMap() {
    return this.jsPropertiesState;
  }
}

export const jsPropertiesState = new JsPropertiesState();

export interface TBasePropertyState {
  value: string;
  position: JSPropertyPosition;
}
export interface TJSFunctionPropertyState extends TBasePropertyState {
  isMarkedAsync: boolean;
}

export type TJSpropertyState = TBasePropertyState | TJSFunctionPropertyState;

export type TJSPropertiesState = Record<
  string,
  Record<string, TJSpropertyState>
>;
