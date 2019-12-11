package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.Set;

@Getter
@Setter
@ToString
@Document
@CompoundIndex(def = "{'organizationId':1, 'name':1}", name = "organization_group_compound_index", unique = true)
public class Group extends BaseDomain {

    @NotNull
    private String name;

    private String displayName;

    @NotNull
    private String organizationId;

    /*
     * This is a list of name of permissions. We will query with permission collection by name
     * This is because permissions are global in nature. They are not specific to a particular org/team.
     */
    Set<String> permissions;

    /**
     * If the display name is null or empty, then just return the actual group name. This is just to ensure that
     * the client is never sent an empty group name for displaying on the UI.
     */
    public String displayName() {
        return (displayName != null || !displayName.isEmpty()) ? displayName : name;
    }
}
