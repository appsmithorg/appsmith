package com.appsmith.server.services;

import com.appsmith.server.domains.Widget;
import reactor.core.publisher.Mono;

public interface WidgetService extends CrudService<Widget, String> {

    Mono<Widget> getByName(String name);
}
