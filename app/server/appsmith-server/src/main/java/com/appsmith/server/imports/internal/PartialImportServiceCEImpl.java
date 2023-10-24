package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.Application;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Slf4j
public class PartialImportServiceCEImpl implements PartialImportServiceCE {

    private final ImportApplicationService importApplicationService;

    @Override
    public Mono<Application> importResourceInPage(String applicationId, String pageId, String branchName, Part file) {
        return null;
    }
}
