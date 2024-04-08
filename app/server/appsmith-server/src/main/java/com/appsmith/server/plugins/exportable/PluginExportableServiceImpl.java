package com.appsmith.server.plugins.exportable;

import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exports.exportable.ExportableService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.WorkspaceService;
import org.springframework.stereotype.Service;

@Service
public class PluginExportableServiceImpl extends PluginExportableServiceCEImpl implements ExportableService<Plugin> {
    public PluginExportableServiceImpl(PluginService pluginService, WorkspaceService workspaceService) {
        super(pluginService, workspaceService);
    }
}
