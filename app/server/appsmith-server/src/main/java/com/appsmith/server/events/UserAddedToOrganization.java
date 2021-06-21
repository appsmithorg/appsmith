package com.appsmith.server.events;

import com.appsmith.server.domains.UserRole;
import lombok.Data;

@Data
public class UserAddedToOrganization {
    private final String organizationId;
    private final UserRole userRole;
}
