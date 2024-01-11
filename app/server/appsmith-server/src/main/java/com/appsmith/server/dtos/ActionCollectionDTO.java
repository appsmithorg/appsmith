package com.appsmith.server.dtos;

import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ce.ActionCollectionCE_DTO;
import com.appsmith.util.PatternUtils;
import com.fasterxml.jackson.annotation.JsonView;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

import java.util.regex.Matcher;

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

    @Override
    public String getUserExecutableName() {
        String userExecutableName = super.getUserExecutableName();
        if (userExecutableName == null || !Boolean.TRUE.equals(this.isPublic)) {
            return userExecutableName;
        }

        Matcher matcher = PatternUtils.COMPOSITE_ENTITY_PARENT_NAME_PATTERN.matcher(userExecutableName);
        if (matcher.find()) {
            userExecutableName = matcher.group(1);
        }
        return userExecutableName;
    }

    @Override
    protected void resetTransientFields() {
        super.resetTransientFields();
        this.setModuleInstanceId(null);
        this.setRootModuleInstanceId(null);
        this.setIsPublic(null);
    }
}
