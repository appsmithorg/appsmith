package com.appsmith.server.services;

import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ce.CurlImporterServiceCEImpl;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CurlImporterServiceImpl extends CurlImporterServiceCEImpl implements CurlImporterService {
    public CurlImporterServiceImpl(
            PluginService pluginService,
            LayoutActionService layoutActionService,
            NewPageService newPageService,
            ObjectMapper objectMapper,
            PagePermission pagePermission) {
        super(pluginService, layoutActionService, newPageService, objectMapper, pagePermission);
    }
}
