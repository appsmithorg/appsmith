package com.appsmith.server.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

@Aspect
@Configuration
public class MongoRepositoryAspect {

    private final Scheduler mongoScheduler = Schedulers.newBoundedElastic(
            Schedulers.DEFAULT_BOUNDED_ELASTIC_SIZE,
            Schedulers.DEFAULT_BOUNDED_ELASTIC_QUEUESIZE,
            "appsmith-mongo-scheduler");

    @Around("execution(public * com.appsmith.server.repositories.*Repository+.*(..))")
    public Object switchThreadPool(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();

        if (result instanceof Mono) {
            return ((Mono<?>) result).subscribeOn(mongoScheduler).publishOn(Schedulers.immediate());
        } else if (result instanceof Flux) {
            return ((Flux<?>) result).subscribeOn(mongoScheduler).publishOn(Schedulers.immediate());
        } else {
            return result;
        }
    }
}
