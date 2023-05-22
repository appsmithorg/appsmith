/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import static com.appsmith.external.constants.ActionConstants.DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import java.util.Set;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class DslActionDTO {

  @JsonView(Views.Public.class)
  String id;

  @JsonView(Views.Internal.class)
  String defaultActionId;

  @JsonView(Views.Internal.class)
  String defaultCollectionId;

  @JsonView(Views.Public.class)
  String name;

  @JsonView(Views.Public.class)
  String collectionId;

  @JsonView(Views.Public.class)
  Boolean clientSideExecution;

  @JsonView(Views.Public.class)
  Boolean confirmBeforeExecute;

  @JsonView(Views.Public.class)
  PluginType pluginType;

  @JsonView(Views.Public.class)
  Set<String> jsonPathKeys;

  @JsonView(Views.Public.class)
  Integer timeoutInMillisecond = DEFAULT_ACTION_EXECUTION_TIMEOUT_MS;

  public void sanitiseForExport() {
    this.setDefaultActionId(null);
    this.setDefaultCollectionId(null);
  }
}
