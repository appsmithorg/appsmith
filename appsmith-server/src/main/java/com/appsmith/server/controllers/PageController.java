package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.PageNameIdDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.PageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping(Url.PAGE_URL)
@Slf4j
public class PageController extends BaseController<PageService, Page, String> {

    @Autowired
    public PageController(PageService service) {
        super(service);
    }

    @Deprecated
    @GetMapping("/application/{applicationId}")
    public Mono<ResponseDTO<List<PageNameIdDTO>>> getPageNamesByApplicationId(@PathVariable String applicationId) {
        return service.findNamesByApplicationId(applicationId)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/application/name/{applicationName}")
    public Mono<ResponseDTO<List<PageNameIdDTO>>> getPageNamesByApplicationName(@PathVariable String applicationName) {
        return service.findNamesByApplicationName(applicationName)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{pageId}/view")
    public Mono<ResponseDTO<Page>> getPageView(@PathVariable String pageId) {
        return service.getPage(pageId, true)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }

    @GetMapping("{pageName}/application/{applicationName}/view")
    public Mono<ResponseDTO<Page>> getPageViewByName(@PathVariable String applicationName, @PathVariable String pageName) {
        return service.getPageByName(applicationName, pageName, true)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }
}
