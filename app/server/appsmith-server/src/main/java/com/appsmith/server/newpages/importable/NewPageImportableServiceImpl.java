package com.appsmith.server.newpages.importable;

import com.appsmith.server.domains.NewPage;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.staticurl.StaticUrlService;
import org.springframework.stereotype.Service;

@Service
public class NewPageImportableServiceImpl extends NewPageImportableServiceCEImpl implements ImportableService<NewPage> {
    public NewPageImportableServiceImpl(
            NewPageService newPageService,
            StaticUrlService staticUrlService,
            ApplicationPageService applicationPageService,
            NewActionService newActionService) {
        super(newPageService, staticUrlService, applicationPageService, newActionService);
    }
}
