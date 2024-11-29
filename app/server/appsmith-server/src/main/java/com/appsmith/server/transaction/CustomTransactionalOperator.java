package com.appsmith.server.transaction;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;

@Component
public class CustomTransactionalOperator {

    private final EntityManagerFactory factory;

    public CustomTransactionalOperator(EntityManagerFactory factory) {
        this.factory = factory;
    }

    public <T> Mono<T> transactional(Mono<T> mono) {
        return Mono.deferContextual(ctx -> {
            EntityManager entityManager = ctx.getOrDefault(TX_CONTEXT, null);
            boolean isNewTransaction = (entityManager == null);

            if (isNewTransaction) {
                entityManager = factory.createEntityManager();
                entityManager.getTransaction().begin();
            }

            EntityManager finalEntityManager = entityManager;
            return mono.contextWrite(Context.of(TX_CONTEXT, finalEntityManager))
                    .doOnSuccess(result -> {
                        if (isNewTransaction) {
                            finalEntityManager.getTransaction().commit();
                        }
                    })
                    .doOnError(error -> {
                        if (isNewTransaction) {
                            finalEntityManager.getTransaction().rollback();
                        }
                    })
                    .doFinally(signal -> {
                        if (isNewTransaction) {
                            finalEntityManager.close();
                        }
                    });
        });
    }

    public <T> Flux<T> transactional(Flux<T> flux) {
        return Flux.deferContextual(ctx -> {
            EntityManager entityManager = ctx.getOrDefault(TX_CONTEXT, null);
            boolean isNewTransaction = (entityManager == null);

            if (isNewTransaction) {
                entityManager = factory.createEntityManager();
                entityManager.getTransaction().begin();
            }

            EntityManager finalEntityManager = entityManager;
            return flux.contextWrite(Context.of(TX_CONTEXT, finalEntityManager))
                    .doOnComplete(() -> {
                        if (isNewTransaction) {
                            finalEntityManager.getTransaction().commit();
                        }
                    })
                    .doOnError(error -> {
                        if (isNewTransaction) {
                            finalEntityManager.getTransaction().rollback();
                        }
                    })
                    .doFinally(signal -> {
                        if (isNewTransaction) {
                            finalEntityManager.close();
                        }
                    });
        });
    }
}
