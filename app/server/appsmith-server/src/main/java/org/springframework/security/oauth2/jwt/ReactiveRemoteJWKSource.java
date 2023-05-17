package org.springframework.security.oauth2.jwt;

import com.appsmith.util.WebClientUtils;
import com.nimbusds.jose.RemoteKeySourceException;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKMatcher;
import com.nimbusds.jose.jwk.JWKSelector;
import com.nimbusds.jose.jwk.JWKSet;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.text.ParseException;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

// Taken from Spring Security 5.4.1, to override the `webClient` used to get the JWK set, for proxy support.
public class ReactiveRemoteJWKSource implements ReactiveJWKSource {

    /**
     * The cached JWK set.
     */
    private final AtomicReference<Mono<JWKSet>> cachedJWKSet = new AtomicReference<>(Mono.empty());

    private final WebClient webClient = WebClientUtils.create();

    private final String jwkSetURL;

    ReactiveRemoteJWKSource(String jwkSetURL) {
        Assert.hasText(jwkSetURL, "jwkSetURL cannot be empty");
        this.jwkSetURL = jwkSetURL;
    }

    @Override
    public Mono<List<JWK>> get(JWKSelector jwkSelector) {
        // @formatter:off
        return this.cachedJWKSet.get()
                .switchIfEmpty(Mono.defer(() -> getJWKSet()))
                .flatMap((jwkSet) -> get(jwkSelector, jwkSet))
                .switchIfEmpty(Mono.defer(() -> getJWKSet()
                        .map((jwkSet) -> jwkSelector.select(jwkSet)))
                );
        // @formatter:on
    }

    private Mono<List<JWK>> get(JWKSelector jwkSelector, JWKSet jwkSet) {
        return Mono.defer(() -> {
            // Run the selector on the JWK set
            List<JWK> matches = jwkSelector.select(jwkSet);
            if (!matches.isEmpty()) {
                // Success
                return Mono.just(matches);
            }
            // Refresh the JWK set if the sought key ID is not in the cached JWK set
            // Looking for JWK with specific ID?
            String soughtKeyID = getFirstSpecifiedKeyID(jwkSelector.getMatcher());
            if (soughtKeyID == null) {
                // No key ID specified, return no matches
                return Mono.just(Collections.emptyList());
            }
            if (jwkSet.getKeyByKeyId(soughtKeyID) != null) {
                // The key ID exists in the cached JWK set, matching
                // failed for some other reason, return no matches
                return Mono.just(Collections.emptyList());
            }
            return Mono.empty();
        });
    }

    /**
     * Updates the cached JWK set from the configured URL.
     * @return The updated JWK set.
     * @throws RemoteKeySourceException If JWK retrieval failed.
     */
    private Mono<JWKSet> getJWKSet() {
        // @formatter:off
        return this.webClient.get()
                .uri(this.jwkSetURL)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parse)
                .doOnNext((jwkSet) -> this.cachedJWKSet
                        .set(Mono.just(jwkSet))
                )
                .cache();
        // @formatter:on
    }

    private JWKSet parse(String body) {
        try {
            return JWKSet.parse(body);
        }
        catch (ParseException ex) {
            throw new RuntimeException(ex);
        }
    }

    /**
     * Returns the first specified key ID (kid) for a JWK matcher.
     * @param jwkMatcher The JWK matcher. Must not be {@code null}.
     * @return The first key ID, {@code null} if none.
     */
    protected static String getFirstSpecifiedKeyID(final JWKMatcher jwkMatcher) {
        Set<String> keyIDs = jwkMatcher.getKeyIDs();
        if (keyIDs == null || keyIDs.isEmpty()) {
            return null;
        }
        for (String id : keyIDs) {
            if (id != null) {
                return id;
            }
        }
        return null; // No kid in matcher
    }

    void setWebClient(WebClient webClient) {
        // NOOP. We don't let this be overridden. This is the whole reason we're overriding this class.
    }

}
