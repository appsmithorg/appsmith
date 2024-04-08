package com.appsmith.server.newpages.defaultresources;

import com.appsmith.server.defaultresources.DefaultResourcesService;
import com.appsmith.server.domains.NewPage;
import org.springframework.stereotype.Service;

@Service
public class NewPageDefaultResourcesServiceImpl extends NewPageDefaultResourcesServiceCEImpl
        implements DefaultResourcesService<NewPage> {}
