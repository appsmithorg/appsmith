package com.appsmith.server.repositories;

import com.appsmith.server.domains.ApprovalRequest;

public interface ApprovalRequestRepository
        extends BaseRepository<ApprovalRequest, String>, CustomApprovalRequestRepository {}
