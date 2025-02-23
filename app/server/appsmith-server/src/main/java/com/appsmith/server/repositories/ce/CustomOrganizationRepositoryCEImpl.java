package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Organization;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CustomOrganizationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepositoryCE {}
