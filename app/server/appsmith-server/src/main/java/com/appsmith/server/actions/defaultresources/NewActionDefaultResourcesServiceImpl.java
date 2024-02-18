package com.appsmith.server.actions.defaultresources;

import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.Action;
import org.springframework.stereotype.Service;

@Service
public class NewActionDefaultResourcesServiceImpl extends NewActionDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<Action> {}
