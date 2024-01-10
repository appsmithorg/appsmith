package com.appsmith.server.newactions.defaultresources;

import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Service;

@Service
public class NewActionDefaultResourcesServiceImpl extends NewActionDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<NewAction> {}
