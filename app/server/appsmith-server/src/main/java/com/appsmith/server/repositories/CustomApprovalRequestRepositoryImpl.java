package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.QApprovalRequest;
import com.appsmith.server.dtos.PagedDomain;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.appsmith.server.constants.FieldName.REQUEST_NAME;
import static com.appsmith.server.constants.FieldName.WORKFLOW_ID;
import static com.appsmith.server.constants.QueryParams.COUNT;
import static com.appsmith.server.constants.QueryParams.RESOLUTION;
import static com.appsmith.server.constants.QueryParams.RESOLVED_BY;
import static com.appsmith.server.constants.QueryParams.START_INDEX;
import static com.appsmith.server.constants.QueryParams.STATUS;

@Component
public class CustomApprovalRequestRepositoryImpl extends BaseAppsmithRepositoryImpl<ApprovalRequest>
        implements CustomApprovalRequestRepository {
    public CustomApprovalRequestRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<PagedDomain<ApprovalRequest>> getAllWithFilters(
            MultiValueMap<String, String> filters, Optional<AclPermission> aclPermission, Optional<Sort> sortWith) {
        int count;
        int startIndex;
        if (StringUtils.isNotEmpty(filters.getFirst(COUNT))) {
            count = Integer.parseInt(filters.getFirst(COUNT));
        } else {
            count = NO_RECORD_LIMIT;
        }
        if (StringUtils.isNotEmpty(filters.getFirst(START_INDEX))) {
            startIndex = Integer.parseInt(filters.getFirst(START_INDEX));
        } else {
            startIndex = NO_SKIP;
        }
        List<Criteria> criteriaList = new ArrayList<>(getCriteriaListFromFilters(filters));
        Sort sort =
                sortWith.orElse(Sort.by(Sort.Direction.DESC, fieldName(QApprovalRequest.approvalRequest.createdAt)));
        Mono<Long> countMono = count(criteriaList, aclPermission);
        Flux<ApprovalRequest> approvalRequestFlux = queryAll()
                .criteria(criteriaList)
                .permission(aclPermission.orElse(null))
                .sort(sort)
                .limit(count)
                .skip(startIndex)
                .submit();
        return Mono.zip(countMono, approvalRequestFlux.collectList()).map(pair -> {
            Long totalFilteredApprovalRequests = pair.getT1();
            List<ApprovalRequest> approvalRequestsPage = pair.getT2();
            return new PagedDomain<>(
                    approvalRequestsPage, approvalRequestsPage.size(), startIndex, totalFilteredApprovalRequests);
        });
    }

    private List<Criteria> getCriteriaListFromFilters(MultiValueMap<String, String> filters) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (MapUtils.isNotEmpty(filters)) {
            if (filters.containsKey(STATUS)) {
                List<String> approvalRequestStatus = filters.get(STATUS);
                criteriaList.add(Criteria.where(fieldName(QApprovalRequest.approvalRequest.resolutionStatus))
                        .in(approvalRequestStatus));
            }

            if (filters.containsKey(RESOLUTION)) {
                List<String> approvalRequestStatus = filters.get(RESOLUTION);
                criteriaList.add(Criteria.where(fieldName(QApprovalRequest.approvalRequest.resolution))
                        .in(approvalRequestStatus));
            }

            if (filters.containsKey(RESOLVED_BY)) {
                List<String> approvalRequestStatus = filters.get(RESOLVED_BY);
                criteriaList.add(Criteria.where(fieldName(QApprovalRequest.approvalRequest.resolvedBy))
                        .in(approvalRequestStatus));
            }

            if (filters.containsKey(WORKFLOW_ID)) {
                List<String> approvalRequestsForWorkflowId = filters.get(WORKFLOW_ID);
                criteriaList.add(Criteria.where(fieldName(QApprovalRequest.approvalRequest.workflowId))
                        .in(approvalRequestsForWorkflowId));
            }

            if (filters.containsKey(REQUEST_NAME)) {
                List<String> approvalRequestsForRequestName = filters.get(REQUEST_NAME);
                criteriaList.add(Criteria.where(fieldName(QApprovalRequest.approvalRequest.requestName))
                        .in(approvalRequestsForRequestName));
            }
        }
        return criteriaList;
    }
}
