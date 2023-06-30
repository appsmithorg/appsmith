import type { JSPropertyPosition, TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { diff } from "deep-diff";
import { klona } from "klona/full";
import { set, union } from "lodash";

class JsPropertiesState {
  private jsPropertiesState: TJSPropertiesState = {};
  private oldJsPropertiesState: TJSPropertiesState = {};
  private updatedProperties: string[] = [];

  startUpdate() {
    this.oldJsPropertiesState = klona(this.jsPropertiesState);
  }

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
  stopUpdate() {
    const difference = diff(this.oldJsPropertiesState, this.jsPropertiesState);
    let updatedJSProperties: string[] = [];
    if (difference) {
      updatedJSProperties = difference.reduce(
        (updatedProperties, currentDiff) => {
          if (!currentDiff.path) return updatedProperties;
          const updatedProperty = currentDiff.path.slice(0, 2).join(".");
          return union(updatedProperties, [updatedProperty]);
        },
        [] as string[],
      );
    }
    this.updatedProperties = updatedJSProperties;
  }
  getMap() {
    return this.jsPropertiesState;
  }
  getUpdatedJSProperties() {
    return this.updatedProperties;
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
