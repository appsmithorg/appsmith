package com.appsmith.server.services;

import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ce.LayoutServiceCEImpl;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LayoutServiceImpl extends LayoutServiceCEImpl implements LayoutService {

    public LayoutServiceImpl(NewPageService newPageService, PagePermission pagePermission) {
        super(newPageService, pagePermission);
    }
}
