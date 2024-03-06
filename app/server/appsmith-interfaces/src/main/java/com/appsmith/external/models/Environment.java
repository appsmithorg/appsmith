package com.appsmith.external.models;

import com.appsmith.external.constants.CommonFieldName;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
@NoArgsConstructor
@FieldNameConstants
public class Environment extends BaseDomain {

    String workspaceId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String name;

    Boolean isDefault;

    public Environment(String workspaceId, String name) {
        this.setWorkspaceId(workspaceId);
        this.setName(name);
        this.setIsDefault(CommonFieldName.PRODUCTION_ENVIRONMENT.equals(name));
    }

    public static class Fields extends BaseDomain.Fields {}
}
