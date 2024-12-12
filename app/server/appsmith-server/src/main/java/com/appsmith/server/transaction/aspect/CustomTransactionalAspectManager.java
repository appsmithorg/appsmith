package com.appsmith.server.transaction.aspect;

import com.appsmith.server.transaction.CustomTransactionalOperator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Slf4j
@Aspect
public class CustomTransactionalAspectManager {

    private final CustomTransactionalOperator transactionalOperator;

    @Around(
            "execution(public * *(..)) && @annotation(com.appsmith.server.transaction.annotations.CustomAppsmithTransaction)")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        Object result = joinPoint.proceed(joinPoint.getArgs());

        if (Mono.class.isAssignableFrom(returnType)) {
            return transactionalOperator.transactional((Mono<?>) result);
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return transactionalOperator.transactional((Flux<?>) result);
        }

        throw new IllegalStateException("Method annotated with @CustomAppsmithTransaction must return a Mono or Flux");
    }
}
