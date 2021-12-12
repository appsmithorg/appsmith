package com.appsmith.server.services;

import com.appsmith.server.services.ce.LayoutServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class LayoutServiceImpl extends LayoutServiceCEImpl implements LayoutService {

    public LayoutServiceImpl(NewPageService newPageService) {

        super(newPageService);
    }
}

