package com.appsmith.server.themes.importable;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.cakes.ThemeRepositoryCake;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.themes.base.ThemeService;
import org.springframework.stereotype.Service;

@Service
public class ThemeImportableServiceImpl extends ThemeImportableServiceCEImpl implements ImportableService<Theme> {

    public ThemeImportableServiceImpl(
            ThemeService themeService,
            ThemeRepository repositoryDirect,
            ThemeRepositoryCake repository,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission) {
        super(themeService, repositoryDirect, repository, applicationService, applicationPermission);
    }
}
