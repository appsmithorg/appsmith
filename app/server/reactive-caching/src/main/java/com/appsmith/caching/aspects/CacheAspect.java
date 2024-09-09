package com.appsmith.caching.aspects;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.caching.components.CacheManager;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

/**
 * CacheAspect is an aspect that is used to cache the results of a method call annotated with Cache.
 * It is also possible to evict the cached result by annotating method with CacheEvict.
 */
@Aspect
@Component
@Slf4j
public class CacheAspect {

    private final CacheManager cacheManager;

    public static final ExpressionParser EXPRESSION_PARSER = new SpelExpressionParser();

    @Autowired
    public CacheAspect(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * This method is used to call original Mono<T> returning method and return the the result after caching it with CacheManager
     *
     * @param joinPoint The join point of the method call
     * @param cacheName The name of the cache
     * @param key       The key to be used for caching
     * @return The result of the method call
     */
    private Mono<Object> callMonoMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Mono<?>) joinPoint.proceed())
                    .zipWhen(value ->
                            cacheManager.put(cacheName, key, value)) // Call CacheManager.put() to cache the object
                    .flatMap(value -> Mono.just(value.getT1())); // Maps to the original object
        } catch (Throwable e) {
            log.error(
                    "Error occurred in saving to cache when invoking function {}",
                    joinPoint.getSignature().getName(),
                    e);
            return Mono.error(e);
        }
    }

    /**
     * This method is used to call original Flux<T> returning method and return the the result after caching it with CacheManager
     *
     * @param joinPoint The join point
     * @param cacheName The name of the cache
     * @param key       The key to be used for caching
     * @return The result of the method call after caching
     */
    private Flux<?> callFluxMethodAndCache(ProceedingJoinPoint joinPoint, String cacheName, String key) {
        try {
            return ((Flux<?>) joinPoint.proceed())
                    .collectList() // Collect Flux<T> into Mono<List<T>>
                    .zipWhen(value ->
                            cacheManager.put(cacheName, key, value)) // Call CacheManager.put() to cache the list
                    .flatMap(value -> Mono.just(value.getT1())) // Maps to the original list
                    .flatMapMany(Flux::fromIterable); // Convert it back to Flux<T>
        } catch (Throwable e) {
            log.error(
                    "Error occurred in saving to cache when invoking function {}",
                    joinPoint.getSignature().getName(),
                    e);
            return Flux.error(e);
        }
    }

    /**
     * This method is used to derive the key name for caching the result of a method call based on method arguments.
     * This uses original strategy used by Spring's Cacheable annotation.
     *
     * @param args Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKeyWithArguments(Object[] args) {
        if (args.length == 0) { // If there are no arguments, return SimpleKey.EMPTY
            return SimpleKey.EMPTY.toString();
        }

        if (args.length == 1) { // If there is only one argument, return its toString() value
            return args[0].toString();
        }

        SimpleKey simpleKey = new SimpleKey(args); // Create SimpleKey from arguments and return its toString() value
        return simpleKey.toString();
    }

    /**
     * This method is used to derive the key name for caching the result of a method call based on method arguments and expression provided.
     *
     * @param expression     SPEL Expression to derive the key name
     * @param parameterNames Names of the method arguments of original method call
     * @param args           Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKeyWithExpression(String expression, String[] parameterNames, Object[] args) {
        // Create EvaluationContext for the expression
        EvaluationContext evaluationContext = new StandardEvaluationContext();
        for (int i = 0; i < args.length; i++) {
            // Add method arguments to evaluation context
            evaluationContext.setVariable(parameterNames[i], args[i]);
        }
        // Parse expression and return the result
        return EXPRESSION_PARSER.parseExpression(expression).getValue(evaluationContext, String.class);
    }

    /**
     * This method is used to derive the key name for caching the result of a method call
     *
     * @param expression     SPEL Expression to derive the key name
     * @param parameterNames Names of the method arguments of original method call
     * @param args           Arguments of original method call
     * @return Key name for caching the result of the method call
     */
    private String deriveKey(String expression, String[] parameterNames, Object[] args) {
        if (expression.isEmpty()) { // If expression is empty, use default strategy
            return deriveKeyWithArguments(args);
        }

        // If expression is not empty, use expression strategy
        return deriveKeyWithExpression(expression, parameterNames, args);
    }

    /**
     * This method defines a Aspect to handle method calls annotated with Cache.
     *
     * @param joinPoint ProceedingJoinPoint of the method call
     * @return Result of the method call, either cached or after calling the original method
     * @throws Throwable
     */
    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.Cache)")
    public Object cacheable(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Cache annotation = method.getAnnotation(Cache.class);
        String cacheName = annotation.cacheName();

        // derive key
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        String key = deriveKey(annotation.key(), parameterNames, args);

        Class<?> returnType = method.getReturnType();
        if (returnType.isAssignableFrom(Mono.class)) { // If method returns Mono<T>
            return cacheManager
                    .get(cacheName, key)
                    .switchIfEmpty(Mono.defer(() -> callMonoMethodAndCache(
                            joinPoint, cacheName,
                            key))); // defer the creation of Mono until subscription as it will call original function
        }

        if (returnType.isAssignableFrom(Flux.class)) { // If method returns Flux<T>
            return cacheManager
                    .get(cacheName, key)
                    .switchIfEmpty(Mono.defer(() -> callFluxMethodAndCache(joinPoint, cacheName, key)
                            .collectList())) // defer the creation of Flux until subscription as it will call original
                    // function
                    .map(value -> (List<?>) value)
                    .flatMapMany(Flux::fromIterable);
        }

        // If method does not returns Mono<T> or Flux<T> raise exception
        throw new IllegalAccessException(
                "Invalid usage of @Cache annotation. Only reactive objects Mono and Flux are supported for caching.");
    }

    /**
     * This method defines a Aspect to handle method calls annotated with ReactiveEvict.
     * Original method should return Mono<?>
     *
     * @param joinPoint ProceedingJoinPoint of the method call
     * @return Mono<Void> that will complete after evicting the key from the cache
     * @throws Throwable
     */
    @Around("execution(public * *(..)) && @annotation(com.appsmith.caching.annotations.CacheEvict)")
    public Object cacheEvict(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        CacheEvict annotation = method.getAnnotation(CacheEvict.class);
        String cacheName = annotation.cacheName();
        boolean all = annotation.all();
        String[] keys = annotation.keys(); // Get the array of keys
        Class<?> returnType = method.getReturnType();

        if (!returnType.isAssignableFrom(Mono.class)) {
            throw new RuntimeException(
                    "Invalid usage of @CacheEvict for " + method.getName() + ". Only Mono<?> is allowed.");
        }

        if (all) { // If all is true, evict all keys from the cache
            return cacheManager.evictAll(cacheName).then((Mono<?>) joinPoint.proceed());
        }

        // Evict multiple keys
        if (keys.length > 0) { // If there are specific keys, evict those
            // Create a Flux from the array of keys and map each key to a Mono of eviction

            // Create the expression parser and evaluation context
            ExpressionParser parser = new SpelExpressionParser();
            StandardEvaluationContext context = new StandardEvaluationContext();

            // Bind method arguments to the context
            String[] parameterNames = signature.getParameterNames();
            List<Mono<Void>> evictionMonos = new ArrayList<>();
            for (int i = 0; i < joinPoint.getArgs().length; i++) {
                context.setVariable(parameterNames[i], joinPoint.getArgs()[i]);
            }

            // Evaluate each key expression
            for (String keyExpression : keys) {
                // Parse and evaluate the expression
                Expression expression = parser.parseExpression(keyExpression);

                Object keyObj = expression.getValue(context);

                // Handle case where the key value is a List
                if (keyObj instanceof List) {
                    List<?> keyList = (List<?>) keyObj;
                    for (Object key : keyList) {
                        if (key != null) {
                            evictionMonos.add(cacheManager.evict(cacheName, key.toString()));
                        }
                    }
                } else {
                    // Single key handling
                    if (keyObj != null) {
                        evictionMonos.add(cacheManager.evict(cacheName, keyObj.toString()));
                    }
                }
            }
            return Flux.fromIterable(evictionMonos)
                    .flatMap(voidMono -> voidMono)
                    .collectList()
                    .then((Mono<?>) joinPoint.proceed());
        }

        // Evict single key
        // derive key
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();
        String key = deriveKey(annotation.key(), parameterNames, args);

        // Evict key from the cache then call the original method
        return cacheManager.evict(cacheName, key).then((Mono<?>) joinPoint.proceed());
    }
}
