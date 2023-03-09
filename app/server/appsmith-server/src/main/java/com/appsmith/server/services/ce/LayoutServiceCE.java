package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Layout;
import reactor.core.publisher.Mono;

public interface LayoutServiceCE {

    Mono<Layout> createLayout(String pageId, Layout layout);

    Mono<Layout> createLayout(String defaultPageId, Layout layout, String branchName);

    Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode);

    Mono<Layout> getLayout(String defaultPageId, String layoutId, Boolean viewMode, String branchName);

}
