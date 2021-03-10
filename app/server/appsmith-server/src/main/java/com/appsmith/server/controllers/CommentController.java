package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.services.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(Url.COMMENT_URL)
public class CommentController extends BaseController<CommentService, Comment, String> {

    @Autowired
    public CommentController(CommentService service) {
        super(service);
    }

}
