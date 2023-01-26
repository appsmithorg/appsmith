package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.apache.commons.lang.StringUtils;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.util.Set;

@Getter
@Setter
@ToString
@Document
public class Group extends BaseDomain {

    @NotNull
    @JsonView(Views.Public.class)
    private String name;

    @JsonView(Views.Public.class)
    private String displayName;

    //Organizations migrated to workspaces, kept the field as deprecated to support the old migration
    @Deprecated
    @NotNull
    @JsonView(Views.Public.class)
    private String organizationId;

    @NotNull
    @JsonView(Views.Public.class)
    String workspaceId;

    /**
     * This is a list of name of permissions. We will query with permission collection by name
     * This is because permissions are global in nature. They are not specific to a particular org/team.
     */
    @JsonView(Views.Public.class)
    Set<String> permissions;

    @JsonView(Views.Public.class)
    private Boolean isDefault = false;

    /**
     * If the display name is null or empty, then just return the actual group name. This is just to ensure that
     * the client is never sent an empty group name for displaying on the UI.
     */
    @JsonView(Views.Public.class)
    public String displayName() {
        return StringUtils.defaultIfEmpty(displayName, name);
    }
}
