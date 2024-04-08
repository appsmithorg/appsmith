package com.appsmith.server.actioncollections.defaultresources;

import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.ActionCollection;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionDefaultResourcesServiceImpl extends ActionCollectionDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<ActionCollection> {}
