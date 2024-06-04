package com.appsmith.server.configurations.git;

import com.appsmith.external.configurations.git.GitConfig;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;

@Component
public class GitConfigImpl extends GitConfigCECompatibleImpl implements GitConfig {
    public GitConfigImpl(TenantService tenantService) {
        super(tenantService);
    }
}
