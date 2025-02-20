package com.appsmith.server.aspect;

import com.appsmith.external.annotations.FeatureFlagged;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.services.FeatureFlagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.beans.Introspector;
import java.lang.reflect.Method;

@RequiredArgsConstructor
@Aspect
@Component
@Slf4j
public class FeatureFlaggedMethodInvokerAspect {

    private final FeatureFlagService featureFlagService;

    private final ApplicationContext applicationContext;

    /**
     * Intercepts method calls that are annotated with {@link FeatureFlagged}.
     * This advice method wraps the intercepted method call, allowing conditional execution based on the state
     * of the specified feature flag.
     *
     * @param joinPoint The join point representing the intercepted method call.
     * @return The result of the intercepted method call
     *
     * @see FeatureFlagged
     */
    @Around("execution(public * *(..)) && @annotation(com.appsmith.external.annotations.FeatureFlagged)")
    public Object invokeMethodAtMethodLevelAnnotation(ProceedingJoinPoint joinPoint) throws IllegalAccessException {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        FeatureFlagged annotation = method.getAnnotation(FeatureFlagged.class);
        if (annotation.featureFlagName() == null) {
            String errorMessage = "Please provide a correct feature flag name";
            AppsmithException exception = getInvalidAnnotationUsageException(method, errorMessage);
            log.error(exception.getMessage());
            throw exception;
        }
        return invokeMethod(joinPoint, annotation, method);
    }

    private Object invokeMethod(ProceedingJoinPoint joinPoint, FeatureFlagged annotation, Method method) {
        FeatureFlagEnum flagName = annotation.featureFlagName();

        Class<?> returnType = method.getReturnType();
        Mono<Boolean> featureFlagMono = featureFlagService.check(flagName);
        if (Mono.class.isAssignableFrom(returnType)) {
            return featureFlagMono.flatMap(isSupported -> (Mono<?>) invokeMethod(isSupported, joinPoint, method));
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return featureFlagMono.flatMapMany(isSupported -> (Flux<?>) invokeMethod(isSupported, joinPoint, method));
        }
        // For non-reactive methods with feature flagging annotation we will be using the in memory feature flag cache
        // which is getting updated whenever the organization feature flags are updated.
        return invokeMethod(isFeatureFlagEnabled(flagName), joinPoint, method);
    }

    private Object invokeMethod(Boolean isFeatureSupported, ProceedingJoinPoint joinPoint, Method method) {
        try {
            if (Boolean.TRUE.equals(isFeatureSupported)) {
                return joinPoint.proceed(joinPoint.getArgs());
            }
            Class<?> targetSuperClass = joinPoint.getTarget().getClass().getSuperclass();
            Object service = applicationContext
                    .getBeansOfType(targetSuperClass)
                    .get(getSpringDefaultBeanName(targetSuperClass.getSimpleName()));
            Method superMethod = targetSuperClass.getMethod(method.getName(), method.getParameterTypes());
            return superMethod.invoke(service, joinPoint.getArgs());
        } catch (Throwable e) {
            if (e instanceof AppsmithException) {
                throw (AppsmithException) e;
            }
            log.error("Exception while invoking super class method", e);
            String errorMessage = "Exception while invoking super class method";
            AppsmithException exception = getInvalidAnnotationUsageException(method, errorMessage);
            log.error(exception.getMessage(), e);
            throw exception;
        }
    }

    /**
     * Method to get default bean name from java classes as per <a href="https://docs.spring.io/spring-framework/docs/5.2.3.RELEASE/spring-framework-reference/core.html#beans-beanname">Spring naming convention</a>
     */
    private String getSpringDefaultBeanName(String beanClassName) {
        return Introspector.decapitalize(beanClassName);
    }

    AppsmithException getInvalidAnnotationUsageException(Method method, String error) {
        return new AppsmithException(
                AppsmithError.INVALID_METHOD_LEVEL_ANNOTATION_USAGE,
                FeatureFlagged.class.getSimpleName(),
                method.getDeclaringClass().getSimpleName(),
                method.getName(),
                error);
    }

    boolean isFeatureFlagEnabled(FeatureFlagEnum flagName) {
        CachedFeatures cachedFeatures = featureFlagService.getCachedOrganizationFeatureFlags();
        return cachedFeatures != null
                && !CollectionUtils.isNullOrEmpty(cachedFeatures.getFeatures())
                && Boolean.TRUE.equals(cachedFeatures.getFeatures().get(flagName.name()));
    }
}
