package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
import com.appsmith.external.views.Views;
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
public class ActionDTO extends ActionCE_DTO {
    @JsonView(Views.Public.class)
    String moduleId;

    @Transient
    @JsonView(Views.Public.class)
    Boolean isPublic;

    @Transient
    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    String workflowId;

    @Override
    public String getExecutableName() {
        String executableName = super.getExecutableName();
        if (!Boolean.TRUE.equals(this.isPublic)) {
            return executableName;
        }
        Matcher matcher = PatternUtils.COMPOSITE_ENTITY_PARENT_NAME_PATTERN.matcher(executableName);
        if (matcher.find()) {
            executableName = matcher.group(1);
        }
        return executableName;
    }
}
