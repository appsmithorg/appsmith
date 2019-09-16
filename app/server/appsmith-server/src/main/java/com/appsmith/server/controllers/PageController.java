package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Page;
import com.appsmith.server.services.PageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.PAGE_URL)
@Slf4j
public class PageController extends BaseController<PageService, Page, String> {

    @Autowired
    public PageController(PageService service) {
        super(service);
    }

}
