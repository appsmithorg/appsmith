package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.dtos.ce.ActionCollectionCE_DTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEmbeddable;
import kotlin.jvm.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@QueryEmbeddable
public class ActionCollectionDTO extends ActionCollectionCE_DTO {
    @JsonView(Views.Public.class)
    String moduleId;

    @JsonView(Views.Public.class)
    @Transient
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    @Transient
    Boolean isPublic;
}
