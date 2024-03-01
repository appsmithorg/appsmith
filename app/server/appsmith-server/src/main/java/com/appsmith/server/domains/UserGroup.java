package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Document
@NoArgsConstructor
@Data
@FieldNameConstants
public class UserGroup extends BaseDomain {

    @NotNull private String name;

    private String description;

    String tenantId;

    Boolean isProvisioned = false;

    /*
    TODO: Ideally, the client should NOT set this field when creating or updating the user groups. Users will be added to
     user groups through the /invite API
    */
    private Set<String> users = new HashSet<>();

    public static class Fields extends BaseDomain.Fields {}
}
