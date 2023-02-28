import { DataTreeEntity, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { EvalContext } from "./evaluate";
import JSObjectCollection from "./JSObject/Collection";
import JSProxy from "./JSObject/JSVariableProxy";

export function setEntityToEvalContext(
  entity: DataTreeEntity,
  entityName: string,
  EVAL_CONTEXT: EvalContext,
) {
  if (entity && "ENTITY_TYPE" in entity) {
    switch (entity.ENTITY_TYPE) {
      case ENTITY_TYPE.JSACTION: {
        const varState = JSObjectCollection.getCurrentVariableState(entityName);
        if (varState) {
          if (self.$isDataField) {
            EVAL_CONTEXT[entityName] = varState;
            return;
          }

          EVAL_CONTEXT[entityName] = JSProxy.create(
            entity,
            entityName,
            varState,
          );
          return;
        }
      }
    }
    EVAL_CONTEXT[entityName] = entity;
  }
}
