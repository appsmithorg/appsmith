package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ce.ActionCollectionCE_DTO;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

@Getter
@Setter
@NoArgsConstructor
@ToString
@QueryEmbeddable
public class ActionCollectionDTO extends ActionCollectionCE_DTO implements Reusable {
    @JsonView(Views.Public.class)
    String moduleId;

    @JsonView(Views.Public.class)
    @Transient
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    @Transient
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    @Transient
    Boolean isPublic;

    @JsonView(Views.Public.class)
    String workflowId;

    @Override
    public void populateTransientFields(ActionCollection actionCollection) {
        super.populateTransientFields(actionCollection);
        this.moduleInstanceId = actionCollection.getModuleInstanceId();
        this.rootModuleInstanceId = actionCollection.getRootModuleInstanceId();
        this.isPublic = actionCollection.getIsPublic();
    }
}
