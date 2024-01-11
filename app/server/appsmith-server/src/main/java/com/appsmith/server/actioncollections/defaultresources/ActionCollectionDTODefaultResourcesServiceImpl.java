package com.appsmith.server.actioncollections.defaultresources;

import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.dtos.ActionCollectionDTO;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionDTODefaultResourcesServiceImpl extends ActionCollectionDTODefaultResourcesServiceCEImpl
        implements DefaultResourcesService<ActionCollectionDTO> {}
