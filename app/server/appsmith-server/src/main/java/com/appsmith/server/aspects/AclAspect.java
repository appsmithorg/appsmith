package com.appsmith.server.aspects;

import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AclEntity;
import com.appsmith.server.services.AclPermission;
import com.appsmith.server.services.DynamicAclPermission;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

//@Aspect
//@Component
@Slf4j
public class AclAspect {

    @Around("this(com.appsmith.server.repositories.BaseRepository)")
//    @Around("execution(* com.appsmith.server.services.CrudService.*(..))")
    public Object checkAuthorization(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Class returnType = signature.getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return ReactiveSecurityContextHolder.getContext()
                    .map(ctx -> ctx.getAuthentication())
                    .filter(auth -> {
                        if (AnonymousAuthenticationToken.class.isAssignableFrom(auth.getClass())) {
                            // The user is anonymous
                            // TODO: This is hard-coded for now. Need to get this from DB policies
                            return true;
                        }
                        return authorizeUser((User) auth.getPrincipal(), method, joinPoint);
                    })
                    // If the user is not authorized, the filter will not emit. Hence, we return "Unauthorized"
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                    // The user is authorized to proceed to function execution
                    .then(Mono.defer(() -> {
                        try {
                            Method m = Class.class.getDeclaredMethod("annotationData", null);
                            m.setAccessible(true);
                            Object annotationData = m.invoke(method.getDeclaringClass());
                            Field annotations = annotationData.getClass().getDeclaredField("annotations");
                            annotations.setAccessible(true);
                            Map<Class<? extends Annotation>, Annotation> map =
                                    (Map<Class<? extends Annotation>, Annotation>) annotations.get(annotationData);
                            Annotation annotation = new DynamicAclPermission("newPrincipal");
                            map.put(AclPermission.class, annotation);

                            return (Mono<Object>) joinPoint.proceed();
                        } catch (Throwable throwable) {
                            throwable.printStackTrace();
                            return null;
                        }
                    }));

        } else if (Flux.class.isAssignableFrom(returnType)) {
            return ReactiveSecurityContextHolder.getContext()
                    .map(ctx -> ctx.getAuthentication())
                    .filter(auth -> {
                        if (AnonymousAuthenticationToken.class.isAssignableFrom(auth.getClass())) {
                            // The user is anonymous
                            // TODO: This is hard-coded for now. Need to get this from DB policies
                            return true;
                        }
                        return authorizeUser((User) auth.getPrincipal(), method, joinPoint);
                    })
                    // If the user is not authorized, the filter will not emit. Hence, we return "Unauthorized"
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                    // The user is authorized to proceed to function execution
                    .thenMany((Flux<Object>) joinPoint.proceed());
        }
        return null;
    }

    private boolean authorizeUser(User user, Method method, ProceedingJoinPoint joinPoint) {
        log.debug("Checking the authorization for user: {} for function: {}", user.getEmail(), method.getName());

        // Get the auth permission to be applied
        AclPermission aclPermissionAnnotation = AnnotationUtils.findAnnotation(method, AclPermission.class);
        if (aclPermissionAnnotation == null) {
            // There are no permission annotations on the method. Continue
            return true;
        }
        String[] authPermission = aclPermissionAnnotation.values();

        // Get the entity on which permission needs to be applied
        String authEntity = ((MethodSignature) joinPoint.getSignature()).getMethod().getDeclaringClass().getAnnotation(AclEntity.class).value();
//        String authEntity = joinPoint.getTarget().getClass().getAnnotation(AclEntity.class).value();

        Set<GrantedAuthority> actualPermissions = new HashSet<>();
        if (authPermission != null && authPermission.length > 0) {
            for (int i = 0; i < authPermission.length; i++) {
                actualPermissions.add(new SimpleGrantedAuthority(authPermission[i] + ":" + authEntity));
            }
        }

        log.debug("Permissions required to execute function: {} are: {}", method.getName(), actualPermissions);
        return user.getAuthorities().containsAll(actualPermissions);
    }
}
