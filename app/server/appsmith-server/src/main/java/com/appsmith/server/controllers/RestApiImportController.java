package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.RestApiImportControllerCE;
import com.appsmith.server.services.CurlImporterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.IMPORT_URL)
@Slf4j
public class RestApiImportController extends RestApiImportControllerCE {

    public RestApiImportController(CurlImporterService curlImporterService) {
        super(curlImporterService);
    }
}
