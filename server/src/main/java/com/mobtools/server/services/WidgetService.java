package com.mobtools.server.services;

import com.mobtools.server.domains.Widget;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface WidgetService {

    Mono<Widget> getByName(String name);

    Flux<Widget> get();

    Mono<Widget> create(Widget widget);

    Mono<Widget> update(Widget widget) throws Exception;
}
