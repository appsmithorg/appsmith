package com.mobtools.server.services;

import com.mobtools.server.domains.Widget;
import reactor.core.publisher.Mono;

public interface WidgetService extends CrudService<Widget, String> {

    Mono<Widget> getByName(String name);
}
