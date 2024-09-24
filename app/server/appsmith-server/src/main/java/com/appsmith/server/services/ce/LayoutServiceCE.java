package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Layout;
import reactor.core.publisher.Mono;

public interface LayoutServiceCE {

    Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode);
}
