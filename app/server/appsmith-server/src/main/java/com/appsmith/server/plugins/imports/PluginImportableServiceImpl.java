package com.appsmith.server.plugins.imports;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.plugins.base.PluginService;
import org.springframework.stereotype.Service;

@Service
public class PluginImportableServiceImpl extends PluginImportableServiceCEImpl implements ImportableService<Plugin> {
    public PluginImportableServiceImpl(PluginService pluginService) {
        super(pluginService);
    }
}
