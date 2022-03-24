package com.appsmith.server.services;

import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ce.PostmanImporterServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PostmanImporterServiceImpl extends PostmanImporterServiceCEImpl implements PostmanImporterService {

    public PostmanImporterServiceImpl(NewPageService newPageService,
                                      ResponseUtils responseUtils) {
        super(newPageService, responseUtils);
    }
}
