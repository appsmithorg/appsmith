package com.appsmith.server.aspect;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class TransactionAspect {

    private final ApplicationRepository applicationRepository;

    private final ThemeRepository themeRepository;

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, AppsmithRepository<?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        map.put(Theme.class, themeRepository);
        map.put(CustomJSLib.class, customJSLibRepository);
        repoByEntityClass = Collections.unmodifiableMap(map);
    }

    @Around("execution(* com.appsmith.server.repositories.cakes..*(..))")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {

        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {
            return Mono.deferContextual(context -> {
                try {
                    // transaction context is not maintained
                    if (context.isEmpty() || !context.hasKey("transactionContext")) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    }
                    Map<String, DBOps> transactionContext = context.get("transactionContext");
                    // Check if it's a write operation
                    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                    String methodName = signature.getMethod().getName();
                    boolean isWriteOp = isWriteOp(methodName);

                    // If the operation is read, operation
                    // 1. Get the object from DB
                    // 2. Check if the object is already present in the context:
                    //      - If not, store the object in the context and return
                    //      - If yes, then return the object as is. We want to just maintain the initial state of the
                    // object as we are concerned with the objects initial state before the transaction started
                    if (!isWriteOp) {
                        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs())).map(obj -> {
                            if (obj instanceof BaseDomain) {
                                DBOps dbOps = new DBOps();
                                dbOps.setEntity(obj);
                                String id = getObjectId(dbOps);
                                if (!transactionContext.containsKey(id)) {
                                    transactionContext.put(id, dbOps);
                                }
                                return obj;
                            }
                            return obj;
                        });
                    } else {
                        // If the operation is writing operation
                        // 1. Extract the id of the object
                        // 2. Check if the object is already present in the context
                        //    a. If yes, execute the DB call
                        //    b. If not get the initial state of the object from DB using findById method on the
                        // repository class
                        //      - If end up in switchIfEmpty means no object is present in the DB and should mark this
                        //         as a new object and store the object in DB
                        //      - If object is present in the DB, then store the initial state in the context
                        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs())).map(obj -> {
                            AppsmithRepository<?> repository = repoByEntityClass.get(obj.getClass());
                            if (repository == null) {
                                log.error(" Unable to find the repository for the entity {}", obj.getClass());
                                return obj;
                            }
                            DBOps dbOps = new DBOps();
                            dbOps.setEntity(obj);
                            if (transactionContext.containsKey(getObjectId(dbOps))) {
                                return obj;
                            }
                            Optional<?> entity = repository.getById(((BaseDomain) obj).getId());
                            dbOps = new DBOps();
                            if (entity.isPresent()) {
                                dbOps.setEntity(entity.get());
                            } else {
                                dbOps.setEntity(obj);
                                dbOps.setNew(true);
                            }
                            transactionContext.put(getObjectId(dbOps), dbOps);
                            return obj;
                        });
                    }

                } catch (Throwable e) {
                    log.error(
                            "Error occurred while invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Mono.error(e);
                }
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return Flux.deferContextual(context -> {
                try {
                    if (!context.isEmpty() && context.hasKey("transactionContext")) {
                        Map<String, DBOps> transactionContext = context.get("transactionContext");
                        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                        String methodName = signature.getMethod().getName();
                        boolean isWriteOp = isWriteOp(methodName);

                        Flux flux = (Flux<?>) joinPoint.proceed(joinPoint.getArgs());

                        if (!isWriteOp) {
                            return flux.map(obj -> {
                                if (obj instanceof BaseDomain) {
                                    DBOps dbOps = new DBOps();
                                    dbOps.setEntity(obj);
                                    String id = getObjectId(dbOps);
                                    if (!transactionContext.containsKey(id)) {
                                        transactionContext.put(id, dbOps);
                                    }
                                    return obj;
                                }
                                return obj;
                            });
                        } else {
                            return flux.map(obj -> {
                                AppsmithRepository<?> repository = repoByEntityClass.get(obj.getClass());
                                if (repository == null) {
                                    log.error(" Unable to find the repository for the entity {}", obj.getClass());
                                    return obj;
                                }
                                DBOps dbOps = new DBOps();
                                dbOps.setEntity(obj);
                                if (transactionContext.containsKey(getObjectId(dbOps))) {
                                    return obj;
                                }
                                Optional<?> entity = repository.getById(((BaseDomain) obj).getId());
                                dbOps = new DBOps();
                                if (entity.isPresent()) {
                                    dbOps.setEntity(entity.get());
                                } else {
                                    dbOps.setEntity(obj);
                                    dbOps.setNew(true);
                                }
                                transactionContext.put(getObjectId(dbOps), dbOps);
                                return obj;
                            });
                        }
                    }

                    return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());

                } catch (Throwable e) {
                    log.error(
                            "Error occurred while adding the user context to the permission object when invoking function {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Flux.error(e);
                }
            });
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

    private boolean isWriteOp(String methodName) {
        return methodName.contains("save")
                || methodName.contains("update")
                || methodName.contains("delete")
                || methodName.contains("insert")
                || methodName.contains("archive");
    }

    private String getObjectId(DBOps obj) {
        return obj != null && obj.getEntity() instanceof BaseDomain ? ((BaseDomain) obj.getEntity()).getId() : null;
    }

    @Getter
    @Setter
    public static class DBOps {
        private Object entity;
        private boolean isModified;
        private boolean isNew;
    }
}
