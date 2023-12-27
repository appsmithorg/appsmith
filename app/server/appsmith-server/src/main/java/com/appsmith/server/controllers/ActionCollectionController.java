package com.appsmith.server.controllers;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.ActionCollectionControllerCE;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutCollectionService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.ACTION_COLLECTION_URL)
public class ActionCollectionController extends ActionCollectionControllerCE {

    public ActionCollectionController(
            ActionCollectionService actionCollectionService,
            LayoutCollectionService layoutCollectionService,
            RefactoringService refactoringService) {
        super(actionCollectionService, layoutCollectionService, refactoringService);
    }
}
