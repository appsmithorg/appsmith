package com.appsmith.server.aspect.component;

import com.appsmith.server.aspect.component.ce_compatible.TestComponentCECompatible;
import reactor.core.publisher.Mono;

public interface TestComponent extends TestComponentCECompatible {

    Mono<String> eeOnlyMethod();
}
