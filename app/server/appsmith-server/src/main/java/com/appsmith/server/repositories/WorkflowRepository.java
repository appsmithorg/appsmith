package com.appsmith.server.repositories;

import com.appsmith.server.domains.Workflow;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkflowRepository extends BaseRepository<Workflow, String>, CustomWorkflowRepository {}
