package com.appsmith.caching.aspects;

import java.lang.reflect.Method;
import java.util.List;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.context.annotation.Configuration;
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

/**
 * ReactiveCacheAspect is an aspect that is used to cache the results of a method call annotated with ReactiveCacheable.
 * It is also possible to evict the cached result by annotating method with ReactiveCacheEvict.
 */
@Aspect
@Configuration
@Slf4j
public class ReactiveCacheAspect {

    private final CacheManager cacheManager;

    public static final ExpressionParser EXPRESSION_PARSER = new SpelExpressionParser();
    
    @Autowired
    public ReactiveCacheAspect(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * This method is used to call original Mono<T> returning method and return the the result after caching it with CacheManager
     */
    private Mono<Object> callMonoMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Mono<?>) joinPoint.proceed())
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Call CacheManager.put() to cache the object
                .flatMap(value -> Mono.just(value.getT1())); //Maps to the original object
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Mono.error(e);
        }
    }

    /**
     * This method is used to call original Flux<T> returning method and return the the result after caching it with CacheManager
     */
    private Flux<?> callFluxMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Flux<?>) joinPoint.proceed())
                .collectList() // Collect Flux<T> into Mono<List<T>>
                .zipWhen(value -> cacheManager.put(cacheName, key, Mono.just(value))) //Call CacheManager.put() to cache the list
                .flatMap(value -> Mono.just(value.getT1())) //Maps to the original list
                .flatMapMany(Flux::fromIterable); //Convert it back to Flux<T>
        } catch (Throwable e) {
            log.error("Error while calling method {}", joinPoint.getSignature().getName(), e);
            return Flux.error(e);
        }
    }

    /**
     * This method is used to derive the key name for caching the result of a method call based on method arguments.
     * This uses original strategy used by Spring's Cacheable annotation.
     * @param args Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKeyWithArguments(Object[] args) {
        if(args.length == 0) { //If there are no arguments, return SimpleKey.EMPTY
            return SimpleKey.EMPTY.toString();
        } else if(args.length == 1) { //If there is only one argument, return its toString() value
            return args[0].toString();
        } else {
            SimpleKey simpleKey = new SimpleKey(args); //Create SimpleKey from arguments and return its toString() value
            return simpleKey.toString();
        }
    }

    /**
     * This method is used to derive the key name for caching the result of a method call based on method arguments and expression provided.
     * @param expression SPEL Expression to derive the key name
     * @param parameterNames Names of the method arguments of original method call
     * @param args Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKeyWithExpression(String expression, String[] parameterNames, Object[] args) {
        //Create EvaluationContext for the expression
        EvaluationContext evaluationContext = new StandardEvaluationContext();
        for (int i = 0; i < args.length; i ++) {
            //Add method arguments to evaluation context
            evaluationContext.setVariable(parameterNames[i], args[i]);
        }
        //Parse expression and return the result
        return EXPRESSION_PARSER.parseExpression(expression).getValue(evaluationContext, String.class);
    }

    /**
     * This method is used to derive the key name for caching the result of a method call
     * @param expression SPEL Expression to derive the key name
     * @param parameterNames Names of the method arguments of original method call
     * @param args Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKey(String expression, String[] parameterNames, Object[] args) {
        if(expression.isEmpty()) { //If expression is empty, use default strategy
            return deriveKeyWithArguments(args);
        } else { //If expression is not empty, use expression strategy
            return deriveKeyWithExpression(expression, parameterNames, args);
        }
    }

    /**
     * This method defines a Aspect to handle method calls annotated with ReactiveCacheable.
     * @param joinPoint ProceedingJoinPoint of the method call
     * @return Result of the method call, either cached or after calling the original method
     * @throws Throwable
     */
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
        if (returnType.isAssignableFrom(Mono.class)) { //If method returns Mono<T>
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callMonoMethodAndCache(joinPoint, cacheName, key))); //defer the creation of Mono until subscription as it will call original function
        } else if (returnType.isAssignableFrom(Flux.class)) { //If method returns Flux<T>
            return cacheManager.get(cacheName, key)
                .switchIfEmpty(Mono.defer(() -> callFluxMethodAndCache(joinPoint, cacheName, key).collectList())) //defer the creation of Flux until subscription as it will call original function
                .map(value -> (List<?>) value)
                .flatMapMany(Flux::fromIterable);
        } else { //If method does not returns Mono<T> or Flux<T> raise exception
            throw new RuntimeException("non reactive object supported (Mono, Flux)");
        }
    }

    /**
     * This method defines a Aspect to handle method calls annotated with ReactiveEvict.
     * Original method should return Mono<?>
     * @param joinPoint ProceedingJoinPoint of the method call
     * @return Mono<Void> that will complete after evicting the key from the cache
     * @throws Throwable
     */
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
        if(all) { //If all is true, evict all keys from the cache
            return cacheManager.evictAll(cacheName)
                .then((Mono<?>) joinPoint.proceed());
        } else {
            //derive key
            String[] parameterNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();
            String key = deriveKey(annotation.key(), parameterNames, args);
            //Evict key from the cache then call the original method
            return cacheManager.evict(cacheName, key)
                .then((Mono<?>) joinPoint.proceed());
        }
    }
}
