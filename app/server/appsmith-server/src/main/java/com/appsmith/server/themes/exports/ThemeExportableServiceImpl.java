package com.appsmith.server.themes.exports;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.themes.base.ThemeService;
import org.springframework.stereotype.Service;

@Service
public class ThemeExportableServiceImpl extends ThemeExportableServiceCEImpl implements ExportableService<Theme> {
    public ThemeExportableServiceImpl(ThemeService themeService) {
        super(themeService);
    }
}
