package com.appsmith.server.aspect.component.ce_compatible;

import com.appsmith.server.aspect.component.ce.TestComponentCEImpl;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class TestComponentCECompatibleImpl extends TestComponentCEImpl implements TestComponentCECompatible {

    @Override
    public Mono<String> eeCeCompatibleDiffMethod() {
        return Mono.just("ce_compatible_impl_method");
    }
}
