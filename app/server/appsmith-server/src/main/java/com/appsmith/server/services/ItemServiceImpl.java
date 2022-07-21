package com.appsmith.server.services;

import com.appsmith.server.services.ce.ItemServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ItemServiceImpl extends ItemServiceCEImpl implements ItemService {

    public ItemServiceImpl(ApiTemplateService apiTemplateService,
                           PluginService pluginService,
                           MarketplaceService marketplaceService,
                           NewActionService newActionService,
                           LayoutActionService layoutActionService) {

        super(apiTemplateService, pluginService, marketplaceService, newActionService, layoutActionService);
    }
}
