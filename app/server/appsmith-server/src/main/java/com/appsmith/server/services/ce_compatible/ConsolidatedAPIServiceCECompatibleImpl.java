package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.jslibs.base.CustomJSLibService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.MockDataService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.ProductAlertService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.ce.ConsolidatedAPIServiceCEImpl;
import com.appsmith.server.themes.base.ThemeService;
import io.micrometer.observation.ObservationRegistry;

public class ConsolidatedAPIServiceCECompatibleImpl extends ConsolidatedAPIServiceCEImpl
        implements ConsolidatedAPIServiceCECompatible {
    public ConsolidatedAPIServiceCECompatibleImpl(
            SessionUserService sessionUserService,
            UserService userService,
            UserDataService userDataService,
            OrganizationService organizationService,
            ProductAlertService productAlertService,
            NewPageService newPageService,
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ThemeService themeService,
            ApplicationPageService applicationPageService,
            ApplicationService applicationService,
            CustomJSLibService customJSLibService,
            PluginService pluginService,
            DatasourceService datasourceService,
            MockDataService mockDataService,
            ObservationRegistry observationRegistry,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(
                sessionUserService,
                userService,
                userDataService,
                organizationService,
                productAlertService,
                newPageService,
                newActionService,
                actionCollectionService,
                themeService,
                applicationPageService,
                applicationService,
                customJSLibService,
                pluginService,
                datasourceService,
                mockDataService,
                observationRegistry,
                cacheableRepositoryHelper);
    }
}
