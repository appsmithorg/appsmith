package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionCollectionViewDTO {
    @JsonView(Views.Public.class)
    String id;

    @JsonView(Views.Public.class)
    String name;

    @JsonView(Views.Public.class)
    String pageId;

    @JsonView(Views.Public.class)
    String applicationId;

    @JsonView(Views.Public.class)
    List<JSValue> variables;

    @JsonView(Views.Public.class)
    List<ActionDTO> actions;

    @JsonView(Views.Public.class)
    String body;
    
    @JsonView(Views.Public.class)
    DefaultResources defaultResources;
}
