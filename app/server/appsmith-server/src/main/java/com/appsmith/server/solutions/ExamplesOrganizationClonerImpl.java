package com.appsmith.server.solutions;

import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.ce.ExamplesOrganizationClonerCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ExamplesOrganizationClonerImpl extends ExamplesOrganizationClonerCEImpl implements ExamplesOrganizationCloner {

    public ExamplesOrganizationClonerImpl(OrganizationService organizationService,
                                          OrganizationRepository organizationRepository,
                                          DatasourceService datasourceService,
                                          DatasourceRepository datasourceRepository,
                                          ConfigService configService,
                                          SessionUserService sessionUserService,
                                          UserService userService,
                                          ApplicationService applicationService,
                                          ApplicationPageService applicationPageService,
                                          NewPageRepository newPageRepository,
                                          NewActionService newActionService,
                                          LayoutActionService layoutActionService,
                                          ActionCollectionService actionCollectionService,
                                          LayoutCollectionService layoutCollectionService) {

        super(organizationService, organizationRepository, datasourceService, datasourceRepository, configService,
                sessionUserService, userService, applicationService, applicationPageService, newPageRepository,
                newActionService, layoutActionService, actionCollectionService, layoutCollectionService);
    }
}
