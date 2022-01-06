package com.appsmith.server.solutions;

import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ce.ImportExportApplicationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ImportExportApplicationServiceImpl extends ImportExportApplicationServiceCEImpl implements ImportExportApplicationService {

    public ImportExportApplicationServiceImpl(DatasourceService datasourceService,
                                              SessionUserService sessionUserService,
                                              NewActionRepository newActionRepository,
                                              DatasourceRepository datasourceRepository,
                                              PluginRepository pluginRepository,
                                              OrganizationService organizationService,
                                              ApplicationService applicationService,
                                              NewPageService newPageService,
                                              ApplicationPageService applicationPageService,
                                              NewPageRepository newPageRepository,
                                              NewActionService newActionService,
                                              SequenceService sequenceService,
                                              ExamplesOrganizationCloner examplesOrganizationCloner,
                                              ActionCollectionRepository actionCollectionRepository,
                                              ActionCollectionService actionCollectionService,
                                              ThemeRepository themeRepository) {

        super(datasourceService, sessionUserService, newActionRepository, datasourceRepository, pluginRepository,
                organizationService, applicationService, newPageService, applicationPageService, newPageRepository,
                newActionService, sequenceService, examplesOrganizationCloner, actionCollectionRepository,
                actionCollectionService, themeRepository);
    }
}
