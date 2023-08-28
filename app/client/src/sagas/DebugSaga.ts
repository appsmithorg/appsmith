import type { JSCollection } from "entities/JSCollection";
import { put, select } from "redux-saga/effects";
import { getUsedActionNames } from "selectors/actionSelectors";
import { getJSCollections } from "selectors/entitiesSelector";

function* codeCrawlerSaga(script: string, propertyPath: string) {
  const entityNames: { [x: string]: true } = yield select(
    getUsedActionNames,
    "",
  );
  const referredEntityNames = Object.keys(entityNames).filter((name) =>
    script.includes(name),
  );
  const jsObjects: JSCollection[] = yield select(getJSCollections);
  const referredJSObjects = jsObjects.filter((jsObject) =>
    referredEntityNames.includes(jsObject.name),
  );

  const referredScripts = referredJSObjects.map((jsObject) => jsObject.body);

  

  
}
