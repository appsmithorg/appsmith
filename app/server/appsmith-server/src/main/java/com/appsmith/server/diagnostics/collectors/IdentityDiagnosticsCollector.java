package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.OrganizationService;
import org.springframework.stereotype.Component;

@Component
public class IdentityDiagnosticsCollector extends IdentityDiagnosticsCollectorCE {

    public IdentityDiagnosticsCollector(UserRepository userRepository, OrganizationService organizationService) {
        super(userRepository, organizationService);
    }
}
