package com.appsmith.server.actioncollections.clonepage;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.clonepage.ClonePageService;
import com.appsmith.server.domains.ActionCollection;
import org.springframework.stereotype.Service;

@Service
public class ActionCollectionClonePageServiceImpl extends ActionCollectionClonePageServiceCEImpl
        implements ClonePageService<ActionCollection> {
    public ActionCollectionClonePageServiceImpl(ActionCollectionService actionCollectionService) {
        super(actionCollectionService);
    }
}
