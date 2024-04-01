package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CustomUsagePulseRepositoryCEImpl extends BaseAppsmithRepositoryImpl<UsagePulse>
        implements CustomUsagePulseRepositoryCE {}
