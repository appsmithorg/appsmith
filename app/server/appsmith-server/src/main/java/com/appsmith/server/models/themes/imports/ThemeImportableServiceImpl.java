package com.appsmith.server.models.themes.imports;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.models.themes.base.ThemeService;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationPermission;
import org.springframework.stereotype.Service;

@Service
public class ThemeImportableServiceImpl extends ThemeImportableServiceCEImpl implements ImportableService<Theme> {

    public ThemeImportableServiceImpl(
            ThemeService themeService,
            ThemeRepository repository,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission) {
        super(themeService, repository, applicationService, applicationPermission);
    }
}
