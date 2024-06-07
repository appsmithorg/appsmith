package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfigCECompatible;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;

@Component
public class GitConfigCECompatibleImpl extends GitConfigCEImpl implements GitConfigCECompatible {
    public GitConfigCECompatibleImpl(TenantService tenantService) {
        super(tenantService);
    }
}
