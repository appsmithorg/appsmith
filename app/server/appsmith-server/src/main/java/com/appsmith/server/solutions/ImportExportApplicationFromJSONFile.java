package com.appsmith.server.solutions;

import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.ExportFile;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImportExportApplicationFromJSONFile {
    private final OrganizationRepository organizationRepository;
    private final DatasourceService datasourceService;
    private final DatasourceRepository datasourceRepository;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final ApplicationService applicationService;
    private final ApplicationPageService applicationPageService;
    private final DatasourceContextService datasourceContextService;
    private final NewPageRepository newPageRepository;
    private final NewActionService newActionService;
    private final LayoutActionService layoutActionService;

    ExportFile removePoliciesAndDecryptPasswords(ExportFile file) {

        file.getPageList().forEach(newPage -> newPage.setPolicies(null));
        file.getExportedApplication().setPolicies(null);
        file.getDatasourceList().forEach(datasource -> datasource.setPolicies(null));
        file.getActionList().forEach(newAction -> newAction.setPolicies(null));

        file.getDatasourceList()
                .forEach(datasource -> {
                    datasource.getDatasourceConfiguration();
                });

    }
}
