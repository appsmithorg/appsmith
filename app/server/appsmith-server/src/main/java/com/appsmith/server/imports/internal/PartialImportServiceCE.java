package com.appsmith.server.imports.internal;

import com.appsmith.server.domains.Application;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface PartialImportServiceCE {

    Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, Part file);
}
