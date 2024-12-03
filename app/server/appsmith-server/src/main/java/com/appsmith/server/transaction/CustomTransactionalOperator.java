package com.appsmith.server.transaction;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.Getter;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.context.Context;
import reactor.util.context.ContextView;

import static com.appsmith.server.constants.ce.FieldNameCE.TRANSACTION_THREAD_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;

@Component
public class CustomTransactionalOperator {

    private final EntityManagerFactory factory;

    public CustomTransactionalOperator(EntityManagerFactory factory) {
        this.factory = factory;
    }

    public <T> Mono<T> transactional(Mono<T> mono) {
        return Mono.deferContextual(ctx -> {
            TransactionalContext txCtx = getTransactionalEntities(ctx);
            EntityManager entityManager = txCtx.getEntityManager();
            Scheduler scheduler = txCtx.getElasticScheduler();
            boolean isNewTransaction = txCtx.isNewTransaction;
            return mono.contextWrite(Context.of(
                            TX_CONTEXT, txCtx.getEntityManager(), TRANSACTION_THREAD_NAME, txCtx.getElasticScheduler()))
                    .doOnSuccess(result -> {
                        if (isNewTransaction) {
                            entityManager.getTransaction().commit();
                        }
                    })
                    .doOnError(error -> {
                        if (isNewTransaction) {
                            entityManager.getTransaction().rollback();
                        }
                    })
                    .doFinally(signal -> {
                        if (isNewTransaction) {
                            entityManager.close();
                            scheduler.disposeGracefully();
                        }
                    });
        });
    }

    public <T> Flux<T> transactional(Flux<T> flux) {
        return Flux.deferContextual(ctx -> {
            TransactionalContext txCtx = getTransactionalEntities(ctx);
            EntityManager entityManager = txCtx.getEntityManager();
            Scheduler scheduler = txCtx.getElasticScheduler();
            boolean isNewTransaction = txCtx.isNewTransaction;
            return flux.contextWrite(Context.of(TX_CONTEXT, entityManager, TRANSACTION_THREAD_NAME, scheduler))
                    .doOnComplete(() -> {
                        if (isNewTransaction) {
                            entityManager.getTransaction().commit();
                        }
                    })
                    .doOnError(error -> {
                        if (isNewTransaction) {
                            entityManager.getTransaction().rollback();
                        }
                    })
                    .doFinally(signal -> {
                        if (isNewTransaction) {
                            entityManager.close();
                            scheduler.disposeGracefully();
                        }
                    });
        });
    }

    private TransactionalContext getTransactionalEntities(ContextView ctx) {
        EntityManager entityManager = ctx.getOrDefault(TX_CONTEXT, null);
        boolean isNewTransaction = (entityManager == null);
        Scheduler elasticScheduler = ctx.getOrDefault(TRANSACTION_THREAD_NAME, null);

        if (isNewTransaction) {
            entityManager = factory.createEntityManager();
            entityManager.getTransaction().begin();
            elasticScheduler = Schedulers.newBoundedElastic(
                    1, Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE, TRANSACTION_THREAD_NAME);
        }

        return new TransactionalContext(entityManager, elasticScheduler, isNewTransaction);
    }

    @Getter
    static class TransactionalContext {
        EntityManager entityManager;
        Scheduler elasticScheduler;
        boolean isNewTransaction;

        public TransactionalContext(EntityManager entityManager, Scheduler elasticScheduler, boolean isNewTransaction) {
            this.entityManager = entityManager;
            this.elasticScheduler = elasticScheduler;
            this.isNewTransaction = isNewTransaction;
        }
    }
}
