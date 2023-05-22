/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionCollectionViewDTO {
String id;
String name;
String pageId;
String applicationId;
List<JSValue> variables;
List<ActionDTO> actions;
String body;
DefaultResources defaultResources;
}
