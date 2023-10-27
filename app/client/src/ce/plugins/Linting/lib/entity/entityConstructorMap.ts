import type {
  WidgetEntity as TWidgetEntity,
  AppsmithEntity as TAppsmithEntity,
  DataTreeEntityConfig,
  WidgetEntityConfig as TWidgetEntityConfig,
  JSActionEntity as TJSActionEntity,
  ActionEntity as TActionEntity,
  PagelistEntity as TPageListEntity,
  ActionEntityConfig as TActionEntityConfig,
  JSActionEntityConfig as TJSActionEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import {
  ENTITY_TYPE,
  type IEntity,
} from "@appsmith/plugins/Linting/lib/entity/types";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";
import { ActionEntity } from "plugins/Linting/lib/entity/ActionEntity";
import { AppsmithEntity } from "plugins/Linting/lib/entity/AppsmithEntity";
import { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";
import { WidgetEntity } from "plugins/Linting/lib/entity/WidgetEntity";
import { PagelistEntity } from "plugins/Linting/lib/entity/PagelistEntity";

export const entityConstructorMap: Record<
  string,
  (props: {
    entity: DataTreeEntity;
    Parser: new () => EntityParser;
    DiffGenerator: new () => EntityDiffGenerator;
    config?: DataTreeEntityConfig;
  }) => IEntity
> = {
  [ENTITY_TYPE.ACTION]: (props) => {
    const { config, DiffGenerator, entity, Parser } = props;
    return new ActionEntity(
      entity as TActionEntity,
      config as TActionEntityConfig,
      new Parser(),
      new DiffGenerator(),
    );
  },
  [ENTITY_TYPE.APPSMITH]: (props) => {
    const { DiffGenerator, entity, Parser } = props;
    return new AppsmithEntity(
      entity as TAppsmithEntity,
      undefined,
      new Parser(),
      new DiffGenerator(),
    );
  },
  [ENTITY_TYPE.JSACTION]: (props) => {
    const { config, DiffGenerator, entity, Parser } = props;
    return new JSEntity(
      entity as TJSActionEntity,
      config as TJSActionEntityConfig,
      new Parser(),
      new DiffGenerator(),
    );
  },
  [ENTITY_TYPE.PAGELIST]: (props) => {
    const { entity } = props;
    return new PagelistEntity(entity as TPageListEntity, undefined);
  },
  [ENTITY_TYPE.WIDGET]: (props) => {
    const { config, DiffGenerator, entity, Parser } = props;
    return new WidgetEntity(
      entity as TWidgetEntity,
      config as TWidgetEntityConfig,
      new Parser(),
      new DiffGenerator(),
    );
  },
};
