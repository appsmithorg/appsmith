package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class UsagePulse extends BaseDomain {

    private String email;

    // Hashed user email
    private String user;
    private String instanceId;
    private String tenantId;
    private Boolean viewMode;
    private Boolean isAnonymousUser;
}
