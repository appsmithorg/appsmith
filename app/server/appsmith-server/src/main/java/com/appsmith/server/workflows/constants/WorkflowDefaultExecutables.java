package com.appsmith.server.workflows.constants;

public class WorkflowDefaultExecutables {
    public static final String MAIN_JS_OBJECT_BODY =
            """
            export default {
                // This is a main file for building your workflows. All activities to be executed should be defined within the executeWorkflow
                // function.
                async executeWorkflow(data) {
                    // This function takes in a json object as arguments (data) which can be passed when you trigger the workflow.
                    // Complete the following line to set up your first activity. Place the cursor after activities, and select the action you'd like"
                    // to execute from the list menu that appears.

                    // await Query1.run();
                    // await Api1.run();

                    return true;
                    }
                }
            """;
    public static final String EXECUTE_WORKFLOW_ACTION_BODY =
            """
            async executeWorkflow(data) {
                // await Query1.run();
                // await Api1.run();

                return true;
            }
            """;
}
