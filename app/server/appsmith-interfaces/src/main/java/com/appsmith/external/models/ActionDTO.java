package com.appsmith.external.models;

import com.appsmith.external.helpers.Reusable;
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

import java.util.Set;
import java.util.regex.Matcher;

@Getter
@Setter
@NoArgsConstructor
@ToString
@QueryEmbeddable
public class ActionDTO extends ActionCE_DTO implements Reusable {
    @JsonView(Views.Public.class)
    String moduleId;

    @Transient
    @JsonView(Views.Public.class)
    Boolean isPublic;

    @Transient
    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @Transient
    @JsonView(Views.Public.class)
    String rootModuleInstanceId;

    @JsonView(Views.Public.class)
    String workflowId;

    @Override
    public Set<String> getExecutableNames() {
        Set<String> executableNames = super.getExecutableNames();
        if (executableNames.isEmpty() || !Boolean.TRUE.equals(this.isPublic)) {
            return executableNames;
        }
        String alternateExecutableName;
        Matcher matcher = PatternUtils.COMPOSITE_ENTITY_PARENT_NAME_PATTERN.matcher(this.getValidName());
        if (matcher.find()) {
            alternateExecutableName = matcher.group(1);
            if (matcher.group(3) != null) {
                alternateExecutableName += matcher.group(3);
            }
            executableNames.add(alternateExecutableName);
        }
        return executableNames;
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
            if (matcher.group(3) != null) {
                userExecutableName += matcher.group(3);
            }
        }
        return userExecutableName;
    }

    @Override
    public Boolean isOnLoadMessageAllowed() {
        return this.getIsPublic() == null || Boolean.TRUE.equals(this.getIsPublic());
    }
}
