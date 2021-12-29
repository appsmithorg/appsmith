package com.appsmith.server.services;

import com.appsmith.server.services.ce.CurlImporterServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CurlImporterServiceImpl extends CurlImporterServiceCEImpl implements CurlImporterService {

    public CurlImporterServiceImpl(PluginService pluginService,
                                   LayoutActionService layoutActionService) {

        super(pluginService, layoutActionService);
    }
}
