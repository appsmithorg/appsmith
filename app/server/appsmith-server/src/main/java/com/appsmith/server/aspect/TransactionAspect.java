package com.appsmith.server.aspect;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.helpers.RepositoryFactory;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
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

    private final RepositoryFactory repositoryFactory;

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

                    EntityData entityData = getArgs(joinPoint.getArgs());
                    boolean isInsertOp = isWriteOp(entityData, (MethodSignature) joinPoint.getSignature());

                    // TODO - remove this once the values are consistent with the new method to check write operation
                    if (isInsertOp != isWriteOp) {
                        log.error(
                                "Mismatch in write operation detection. isNewWriteOp: {}, isWriteOp: {}",
                                isInsertOp,
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
                    if (!isInsertOp) {
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
                        if ((entityData.getUpdate() != null && isUpdateOp(entityData.getUpdate()))
                                || (isArchiveOp((MethodSignature) joinPoint.getSignature()))) {
                            addEntityToMapUpdateAndArchiveOp(transactionContext, entityData.getId());
                            return ((Mono<?>) joinPoint.proceed(joinPoint.getArgs()));
                        }

                        BaseDomain domain = entityData.getBaseDomain();
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
                        EntityData entityData = getArgs(joinPoint.getArgs());

                        boolean isInsertOp = isWriteOp(entityData, (MethodSignature) joinPoint.getSignature());

                        Flux flux = (Flux<?>) joinPoint.proceed(joinPoint.getArgs());

                        if (!isInsertOp) {
                            return flux.map(obj -> updateContextMapWithReadOperation(transactionContext, obj));
                        } else {
                            if ((entityData.getUpdate() != null && isUpdateOp(entityData.getUpdate()))
                                    || (isArchiveOp((MethodSignature) joinPoint.getSignature()))) {
                                addEntityToMapUpdateAndArchiveOp(transactionContext, entityData.getId());
                                return flux;
                            }

                            BaseDomain domain = entityData.getBaseDomain();
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

    private EntityData getArgs(Object[] args) {
        // To store the baseDomain and the id of the object and BridgeUpdate
        // when the BaseDomain is not present, in the case of updateById methods

        EntityData entityData = new EntityData();
        for (Object arg : args) {
            if (arg instanceof BaseDomain domain) {
                entityData.setBaseDomain(domain);
            } else if (arg instanceof String && isUUIDString((String) arg)) {
                entityData.setId((String) arg);
            } else if (arg instanceof BridgeUpdate) {
                entityData.setUpdate((BridgeUpdate) arg);
            }
        }
        return entityData;
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

    private boolean isWriteOp(EntityData entityData, MethodSignature signature) {
        // Special case like findCustomJsLib accepting the BaseDomain object as parameter instead of the UUID,
        // hence the need to check for method name as well
        if (entityData.getBaseDomain() != null
                && isSaveOrCreateOp(entityData.getBaseDomain())
                && !signature.getMethod().getName().contains(FIND)) {
            return true;
        } else if (entityData.getUpdate() != null && isUpdateOp(entityData.getUpdate())) {
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
        return repositoryFactory.getRepositoryFromEntity(object);
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

    @Getter
    @Setter
    public static class EntityData {
        private BaseDomain baseDomain;
        private String id;
        private BridgeUpdate update;
    }
}
