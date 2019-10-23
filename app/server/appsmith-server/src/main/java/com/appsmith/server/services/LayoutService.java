package com.appsmith.server.services;

import com.appsmith.server.domains.Layout;
import reactor.core.publisher.Mono;

public interface LayoutService {
    Mono<Layout> createLayout(String pageId, Layout layout);

    Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode);

    Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout);
}
