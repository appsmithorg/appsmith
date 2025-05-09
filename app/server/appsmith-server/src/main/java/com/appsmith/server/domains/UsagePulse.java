package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
public class UsagePulse extends BaseDomain {

    private String email;

    // Hashed user email
    private String user;
    private String instanceId;
    private String organizationId;
    private Boolean viewMode;
    private Boolean isAnonymousUser;

    @Deprecated
    // TODO: Remove this field once we have migrated the data to use organizationId instead of tenantId
    private String tenantId;
}
