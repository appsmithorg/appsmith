package com.appsmith.server.aspect;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;

@Component
@RequiredArgsConstructor
@Slf4j
@Aspect
public class CustomAppsmithTransactionManager {

    private final EntityManagerFactory entityManagerFactory;

    @Around("execution(public * *(..)) && @annotation(com.appsmith.server.annotations.CustomAppsmithTransaction)")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {

        EntityManager entityManager = entityManagerFactory.createEntityManager();
        entityManager.getTransaction().begin();
        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()))
                    .contextWrite(ctx -> ctx.put(TX_CONTEXT, entityManager))
                    .doOnSuccess(success -> {
                        entityManager.getTransaction().commit();
                        entityManager.close();
                    })
                    .doOnError(error -> {
                        entityManager.getTransaction().rollback();
                        entityManager.close();
                    });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return ((Flux<?>) joinPoint.proceed(joinPoint.getArgs()))
                    .contextWrite(ctx -> ctx.put(TX_CONTEXT, entityManager))
                    .doOnComplete(() -> {
                        entityManager.getTransaction().commit();
                        entityManager.close();
                    })
                    .doOnError(error -> {
                        entityManager.getTransaction().rollback();
                        entityManager.close();
                    });
        }
        throw new IllegalStateException("Method annotated with @CustomAppsmithTransaction must return a Mono or Flux");
    }
}
