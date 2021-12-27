package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.CommentControllerCE;
import com.appsmith.server.services.CommentService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.COMMENT_URL)
public class CommentController extends CommentControllerCE {

    public CommentController(CommentService service) {
        super(service);
    }

}
