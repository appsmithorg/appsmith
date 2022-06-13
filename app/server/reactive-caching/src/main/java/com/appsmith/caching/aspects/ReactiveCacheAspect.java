package com.appsmith.caching.aspects;

import java.lang.reflect.Method;
import java.util.List;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import com.appsmith.caching.annotations.ReactiveCacheEvict;
import com.appsmith.caching.annotations.ReactiveCacheable;
import com.appsmith.caching.components.CacheManager;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Aspect
@Configuration
@ConditionalOnClass({ReactiveRedisTemplate.class})
@Slf4j
public class ReactiveCacheAspect {

    private final CacheManager cacheManager;

    public static final ExpressionParser EXPRESSION_PARSER = new SpelExpressionParser();
    
    @Autowired
    public ReactiveCacheAspect(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    private Mono<Object> callMonoMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Mono<?>) joinPoint.proceed())
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Mono<Object> -> Mono<Touple2<Object, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())); //Mono<Touple2<Object, Boolean>> -> Mono<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Mono.error(e);
        }
    }

    private Flux<?> callFluxMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Flux<?>) joinPoint.proceed())
                .collectList()
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Flux<Object> -> Mono<Touple2<List<Object>, Boolean>>
                .flatMap(value -> Mono.just(value.getT1())) //Mono<Touple2<List<Object>, Boolean>> -> Mono<List<Object>>
                .flatMapMany(Flux::fromIterable); //Mono<List<Object>> -> Flux<Object>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Flux.error(e);
        }
    }

    // This is how Cacheable (non-reactive) annotation derive the key name
    private String deriveKeyWithArguments(Object[] args) {
        if(args.length == 0) {
            return SimpleKey.EMPTY.toString();
        } else if(args.length == 1) {
            return args[0].toString();
        } else {
            SimpleKey simpleKey = new SimpleKey(args);
            return simpleKey.toString();
        }
    }

    private String deriveKeyWithExpression(String expression, String[] parameterNames, Object[] args) {
        EvaluationContext evaluationContext = new StandardEvaluationContext();
        for (int i = 0; i < args.length; i ++) {
            evaluationContext.setVariable(parameterNames[i], args[i]);
        }
        return EXPRESSION_PARSER.parseExpression(expression).getValue(evaluationContext, String.class);
    }

    private String deriveKey(String expression, String[] parameterNames, Object[] args) {
        if(expression.isEmpty()) {
            return deriveKeyWithArguments(args);
        } else {
            return deriveKeyWithExpression(expression, parameterNames, args);
        }
    }

    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.ReactiveCacheable)")
    public Object reactiveCacheable(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ReactiveCacheable annotation = method.getAnnotation(ReactiveCacheable.class);
        String cacheName = annotation.cacheName();

        //derive key
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        String key = deriveKey(annotation.key(), parameterNames, args);

        Class<?> returnType = method.getReturnType();
        if (returnType.isAssignableFrom(Mono.class)) {
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callMonoMethodAndCache(joinPoint, cacheName, key))); //defer the creation of Mono until subscription as it will call original function
        } else if (returnType.isAssignableFrom(Flux.class)) {
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callFluxMethodAndCache(joinPoint, cacheName, key).collectList())) //defer the creation of Flux until subscription as it will call original function
                .map(value -> (List<?>) value)
                .flatMapMany(Flux::fromIterable);
    
        } else {
            throw new RuntimeException("non reactive object supported (Mono, Flux)");
        }
    }

    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.ReactiveCacheEvict)")
    public Object reactiveCacheEvict(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        ReactiveCacheEvict annotation = method.getAnnotation(ReactiveCacheEvict.class);
        String cacheName = annotation.cacheName();
        boolean all = annotation.all();
        Class<?> returnType = method.getReturnType();
        if (!returnType.isAssignableFrom(Mono.class)) {
            throw new RuntimeException("Just Mono<?> allowed for cacheEvict");
        }
        if(all) {
            return cacheManager.evictAll(cacheName)
                .then((Mono<?>) joinPoint.proceed());
        } else {
            //derive key
            String[] parameterNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();
            String key = deriveKey(annotation.key(), parameterNames, args);
            return cacheManager.evict(cacheName, key)
                .then((Mono<?>) joinPoint.proceed());
        }
    }
}
