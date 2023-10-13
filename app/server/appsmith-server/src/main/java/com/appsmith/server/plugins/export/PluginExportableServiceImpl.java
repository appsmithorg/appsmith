package com.appsmith.server.plugins.export;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.export.exportable.ExportableService;
import com.appsmith.server.plugins.base.PluginService;
import org.springframework.stereotype.Service;

@Service
public class PluginExportableServiceImpl extends PluginExportableServiceCEImpl implements ExportableService<Plugin> {
    public PluginExportableServiceImpl(PluginService pluginService) {
        super(pluginService, workspaceService);
    }
}
