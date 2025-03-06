package com.appsmith.server.git;

import com.appsmith.server.domains.Artifact;
import reactor.core.publisher.Mono;

public interface GitArtifactTestUtils<T extends Artifact> {
    Mono<Void> createADiff(Artifact artifact);
}
