package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@QueryEmbeddable
public class ActionDTO extends ActionCE_DTO {
    @JsonView(Views.Public.class)
    String moduleId;

    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    String owningModuleInstanceId;

    @JsonView(Views.Public.class)
    String workflowId;
}
