package com.appsmith.server.themes.base;

import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ThemeServiceImpl extends ThemeServiceCEImpl implements ThemeService {
    public ThemeServiceImpl(
            Validator validator,
            ThemeRepository repository,
            AnalyticsService analyticsService,
            ApplicationRepository applicationRepository,
            ApplicationService applicationService,
            PolicyGenerator policyGenerator,
            ApplicationPermission applicationPermission) {
        super(
                validator,
                repository,
                analyticsService,
                applicationRepository,
                applicationService,
                policyGenerator,
                applicationPermission);
    }
}
