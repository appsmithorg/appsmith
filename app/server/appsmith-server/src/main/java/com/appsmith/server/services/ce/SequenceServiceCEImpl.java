package com.appsmith.server.services.ce;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import java.util.Optional;

import static com.appsmith.server.helpers.ReactorUtils.asMono;

@RequiredArgsConstructor
public class SequenceServiceCEImpl implements SequenceServiceCE {

    private final EntityManager entityManager;

    private Mono<Long> getNext(String name) {
        // XXX: This is very much a Postgres-only shenanigan SQL statement.
        final Query query = entityManager.createNativeQuery(
                """
                INSERT INTO "sequence" (name, next_number)
                VALUES (:name, 1)
                ON CONFLICT (name) DO UPDATE SET next_number = "sequence".next_number + 1
                RETURNING next_number
                """);

        query.setParameter("name", name);

        return asMono(() -> Optional.of((Long) query.getSingleResult()));
    }

    @Override
    public Mono<String> getNextAsSuffix(Class<? extends BaseDomain> domainClass, String suffix) {
        final String className = domainClass.getName();
        final String name = className.substring(0, 1).toLowerCase() + className.substring(1) + suffix;
        return getNext(name).map(number -> number > 1 ? " " + number : "");
    }
}
