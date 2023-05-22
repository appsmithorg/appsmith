package com.appsmith.server.solutions;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.solutions.ce.EmailSolutionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class EmailSolutionImpl extends EmailSolutionCEImpl implements EmailSolution {

    public EmailSolutionImpl(EmailSender emailSender, CommonConfig commonConfig) {
        super(emailSender, commonConfig);
    }
}
