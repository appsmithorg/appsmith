package com.appsmith.server.aspect;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
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
import java.util.UUID;

import static com.appsmith.server.constants.ce.FieldNameCE.ARCHIVE;
import static com.appsmith.server.constants.ce.FieldNameCE.FIND;
import static com.appsmith.server.constants.ce.FieldNameCE.TRANSACTION_CONTEXT;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class TransactionAspect {

    private final DatasourceRepository datasourceRepository;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final CustomJSLibRepository customJSLibRepository;

    private final ThemeRepository themeRepository;

    private final ApplicationRepository applicationRepository;

    private final NewPageRepository newPageRepository;

    private final NewActionRepository newActionRepository;

    private final ActionCollectionRepository actionCollectionRepository;

    private Map<Class<?>, AppsmithRepository<?>> repoByEntityClass;

    @PostConstruct
    public void init() {
        final Map<Class<?>, AppsmithRepository<?>> map = new HashMap<>();
        map.put(Datasource.class, datasourceRepository);
        map.put(DatasourceStorage.class, datasourceStorageRepository);
        map.put(Theme.class, themeRepository);
        map.put(CustomJSLib.class, customJSLibRepository);
        map.put(Application.class, applicationRepository);
        map.put(NewPage.class, newPageRepository);
        map.put(NewAction.class, newActionRepository);
        map.put(ActionCollection.class, actionCollectionRepository);
        repoByEntityClass = Collections.unmodifiableMap(map);
    }

    @Around("execution(* com.appsmith.server.repositories.cakes..*(..))")
    public Object handleTransaction(ProceedingJoinPoint joinPoint) throws Throwable {

        Class<?> returnType =
                ((MethodSignature) joinPoint.getSignature()).getMethod().getReturnType();

        if (Mono.class.isAssignableFrom(returnType)) {

            return Mono.deferContextual(context -> {
                try {
                    // Check if the transaction context is available, if not execute the DB call and return
                    if (context.isEmpty() || !context.hasKey(TRANSACTION_CONTEXT)) {
                        return (Mono<?>) joinPoint.proceed(joinPoint.getArgs());
                    }
                    Map<String, DBOps> transactionContext = context.get(TRANSACTION_CONTEXT);
                    // Check if it's a write operation
                    boolean isWriteOp = isWriteOp((MethodSignature) joinPoint.getSignature());

                    Object[] args = getArgs(joinPoint.getArgs());
                    boolean isNewWriteOp = isWriteOp(args, (MethodSignature) joinPoint.getSignature());

                    // TODO - remove this once the values are consistent with the new method to check write operation
                    if (isNewWriteOp != isWriteOp) {
                        log.error(
                                "Mismatch in write operation detection. isNewWriteOp: {}, isWriteOp: {}",
                                isNewWriteOp,
                                isWriteOp);
                    }
                    // If the operation is read, operation
                    // 1. Get the object from DB
                    // 2. Check if the object is already present in the context:
                    //      - If not, store the object in the context and return
                    //      - If yes, then return the object as is. We want to just maintain the initial state of the
                    // object as we are concerned with the object initial state before the transaction started
                    // We are considering the previous state of the db,
                    // because we want to revert the changes if the transaction fails, and we want to store the initial
                    // state of the object before the transaction started.
                    // This cleanup is done in the TransactionHandler class in Solution module
                    if (!isWriteOp) {
                        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()))
                                .map(obj -> updateContextMapWithReadOperation(transactionContext, obj));
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
                        if ((args[2] != null && isUpdateOp(args[2]))
                                || (isArchiveOp((MethodSignature) joinPoint.getSignature()))) {
                            addEntityToMapUpdateAndArchiveOp(transactionContext, (String) args[1]);
                            return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()));
                        }

                        BaseDomain domain = (BaseDomain) args[0];
                        if (domain.getId() == null) {
                            domain.setId(generateId());
                        }
                        addEntityToContextMap(transactionContext, domain);
                        return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()));
                    }

                } catch (Throwable e) {
                    log.error(
                            "Error while executing the function in the Transaction Aspect {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Mono.error(e);
                }
            });
        } else if (Flux.class.isAssignableFrom(returnType)) {
            return Flux.deferContextual(context -> {
                try {
                    if (!context.isEmpty() && context.hasKey(TRANSACTION_CONTEXT)) {
                        Map<String, DBOps> transactionContext = context.get(TRANSACTION_CONTEXT);
                        Object[] args = getArgs(joinPoint.getArgs());
                        boolean isWriteOp = isWriteOp(args, (MethodSignature) joinPoint.getSignature());

                        Flux flux = (Flux<?>) joinPoint.proceed(joinPoint.getArgs());

                        if (!isWriteOp) {
                            return flux.map(obj -> updateContextMapWithReadOperation(transactionContext, obj));
                        } else {
                            if ((args[2] != null && isUpdateOp(args[2]))
                                    || (isArchiveOp((MethodSignature) joinPoint.getSignature()))) {
                                addEntityToMapUpdateAndArchiveOp(transactionContext, (String) args[1]);
                                return flux;
                            }

                            BaseDomain domain = (BaseDomain) args[0];
                            if (domain.getId() == null) {
                                domain.setId(generateId());
                            }
                            addEntityToContextMap(transactionContext, domain);
                            return flux;
                        }
                    }

                    return (Flux<?>) joinPoint.proceed(joinPoint.getArgs());

                } catch (Throwable e) {
                    log.error(
                            "Error while executing the function in the Transaction Aspect {}",
                            joinPoint.getSignature().getName(),
                            e);
                    return Flux.error(e);
                }
            });
        }
        return joinPoint.proceed(joinPoint.getArgs());
    }

    private Object[] getArgs(Object[] args) {
        // To store the baseDomain and the id of the object and BridgeUpdate
        // when the BaseDomain is not present, in the case of updateById methods
        Object[] newArgs = new Object[3];
        for (Object arg : args) {
            if (arg instanceof BaseDomain domain) {
                newArgs[0] = domain;
            } else if (arg instanceof String && isUUIDString((String) arg)) {
                newArgs[1] = arg;
            } else if (arg instanceof BridgeUpdate) {
                newArgs[2] = arg;
            }
        }
        return newArgs;
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    private boolean isUUIDString(String id) {
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private void addEntityToMapUpdateAndArchiveOp(Map<String, DBOps> transactionContext, String id) {
        BaseDomain domainObject = new BaseDomain() {};
        domainObject.setId(id);
        addEntityToContextMap(transactionContext, domainObject);
    }

    private Object updateContextMapWithReadOperation(Map<String, DBOps> transactionContext, Object obj) {
        if (obj instanceof BaseDomain) {
            DBOps dbOps = new DBOps();
            dbOps.setEntity(obj);
            dbOps.setModified(false);
            String id = getObjectId(dbOps);
            if (!transactionContext.containsKey(id)) {
                transactionContext.put(id, dbOps);
            }
            return obj;
        }
        return obj;
    }

    private void addEntityToContextMap(Map<String, DBOps> transactionContext, Object obj) {
        AppsmithRepository<?> repository = getDomainClassFromObject(obj);
        if (repository == null) {
            log.error(" Unable to find the repository for the entity {}", obj.getClass());
            return;
        }
        DBOps dbOps = new DBOps();
        dbOps.setEntity(obj);
        if (transactionContext.containsKey(getObjectId(dbOps))) {
            return;
        }
        Optional<?> entity = repository.getById(((BaseDomain) obj).getId());
        dbOps = new DBOps();
        if (entity.isPresent()) {
            dbOps.setEntity(entity.get());
            dbOps.setModified(true);
        } else {
            dbOps.setEntity(obj);
            dbOps.setNew(true);
        }
        transactionContext.put(getObjectId(dbOps), dbOps);
    }

    private boolean isWriteOp(Object[] args, MethodSignature signature) {
        // Special case like findCustomJsLib accepting the BaseDomain object as parameter instead of the UUID,
        // hence the need to check for method name as well
        if (args[0] != null
                && isSaveOrCreateOp(args[0])
                && !signature.getMethod().getName().contains(FIND)) {
            return true;
        } else if (args[2] != null && isUpdateOp(args[2])) {
            return true;
        } else return isArchiveOp(signature);
    }

    private boolean isSaveOrCreateOp(Object obj) {
        return obj instanceof BaseDomain;
    }

    private boolean isUpdateOp(Object obj) {
        return obj instanceof BridgeUpdate;
    }

    private boolean isArchiveOp(MethodSignature signature) {
        return signature.getMethod().getName().contains(ARCHIVE);
    }

    // TODO - remove this method, used only for testing the validity of the new method
    private boolean isWriteOp(MethodSignature signature) {
        String methodName = signature.getMethod().getName();
        // save/create instance of BaseDomain
        // update instance of BridgeUpdate
        // archive is archive
        return methodName.contains("save")
                || methodName.contains("update")
                || methodName.contains("delete")
                || methodName.contains("insert")
                || methodName.contains("archive");
    }

    private AppsmithRepository<?> getDomainClassFromObject(Object object) {
        if (object instanceof Datasource) {
            return repoByEntityClass.get(Datasource.class);
        } else if (object instanceof DatasourceStorage) {
            return repoByEntityClass.get(DatasourceStorage.class);
        } else if (object instanceof Theme) {
            return repoByEntityClass.get(Theme.class);
        } else if (object instanceof NewPage) {
            return repoByEntityClass.get(NewPage.class);
        } else if (object instanceof ActionCollectionDTO) {
            return repoByEntityClass.get(ActionCollectionDTO.class);
        } else if (object instanceof ActionDTO) {
            return repoByEntityClass.get(ActionDTO.class);
        } else if (object instanceof CustomJSLib) {
            return repoByEntityClass.get(CustomJSLib.class);
        } else if (object instanceof Application) {
            return repoByEntityClass.get(Application.class);
        }
        return null;
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
