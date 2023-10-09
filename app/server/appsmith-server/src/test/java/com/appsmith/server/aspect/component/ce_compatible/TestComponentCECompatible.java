package com.appsmith.server.aspect.component.ce_compatible;

import com.appsmith.server.aspect.component.ce.TestComponentCE;
import reactor.core.publisher.Mono;

public interface TestComponentCECompatible extends TestComponentCE {

    Mono<String> eeCeCompatibleDiffMethod();
}
