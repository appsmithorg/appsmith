package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CustomTenantRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Tenant>
        implements CustomTenantRepositoryCE {}
