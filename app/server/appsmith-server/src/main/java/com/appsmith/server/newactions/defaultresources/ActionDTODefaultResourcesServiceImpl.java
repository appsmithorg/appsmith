package com.appsmith.server.newactions.defaultresources;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.defaultresources.DefaultResourcesService;
import org.springframework.stereotype.Service;

@Service
public class ActionDTODefaultResourcesServiceImpl extends ActionDTODefaultResourcesServiceCEImpl
        implements DefaultResourcesService<ActionDTO> {}
