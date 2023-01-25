package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.Views;
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
    @JsonView(Views.Api.class)
    String id;

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String pageId;

    @JsonView(Views.Api.class)
    String applicationId;

    @JsonView(Views.Api.class)
    List<JSValue> variables;

    @JsonView(Views.Api.class)
    List<ActionDTO> actions;

    @JsonView(Views.Api.class)
    String body;
    
    @JsonView(Views.Api.class)
    DefaultResources defaultResources;
}
