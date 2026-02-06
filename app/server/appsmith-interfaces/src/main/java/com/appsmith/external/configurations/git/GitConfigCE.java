package com.appsmith.external.configurations.git;

import reactor.core.publisher.Mono;

public interface GitConfigCE {
    Mono<Boolean> getIsAtomicPushAllowed();

    /**
     * Returns whether SSH proxy should be disabled for Git operations.
     *
     * <p>When disabled (returns true), SSH connections will bypass all proxy settings
     * and connect directly to the Git server (requires port 22 to be open).
     *
     * <p>When enabled (returns false, which is the default), SSH connections will use
     * system/environment proxy settings via DefaultProxyDataFactory.
     *
     * @return Mono&lt;Boolean&gt; - true if proxy should be DISABLED, false if proxy should be ENABLED (default)
     */
    Mono<Boolean> isSshProxyDisabled();
}
