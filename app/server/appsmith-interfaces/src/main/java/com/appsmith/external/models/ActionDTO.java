package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class ActionDTO extends ActionCE_DTO {
    @JsonView(Views.Public.class)
    String moduleId;

    @JsonView(Views.Public.class)
    String moduleInstanceId;

    @JsonView(Views.Public.class)
    Boolean isPublic;

    @Transient
    @JsonView(Views.Internal.class)
    ActionContext context;

    public enum ActionContext {
        MODULE,
        PAGE
    }
}
