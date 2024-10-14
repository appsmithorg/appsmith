// api.ts
export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
}

export interface Message {
  id: string;
  sender: "user" | "bot";
  content: string;
  date: string;
}

export const getConversationHistory = async (): Promise<Conversation[]> => {
  // Replace with actual API call
  // For demonstration, returning mock data
  return Promise.resolve([
    { id: "1", title: "Conversation 1", lastMessage: "How can I help you?" },
    { id: "2", title: "Conversation 2", lastMessage: "Thank you!" },
  ]);
};

export const getConversation = async (): Promise<Message[]> => {
  // Replace with actual API call
  // For demonstration, returning mock data
  return Promise.resolve([
    {
      id: "msg1",
      sender: "user",
      content: "How do I create an alert in Appsmith?",
      date: new Date().toISOString(),
    },
    {
      id: "msg2",
      sender: "bot",
      date: new Date().toISOString(),
      content: `In Appsmith, showing an alert is a straightforward process that you can achieve using the built-in \`showAlert\` function. This function can be used to display a simple notification message to the user. Below, I'll guide you through the steps to create an alert in your Appsmith application.

### Step-by-Step Guide to Show an Alert in Appsmith

#### Step 1: Open Your Appsmith Project
First, ensure you are on the dashboard of your Appsmith project where you want to add the alert.

#### Step 2: Add a Trigger (Button Widget)
For demonstration purposes, let’s use a button to trigger the alert.

1. Drag a **Button** widget from the widget pane onto the canvas.
2. Click on the newly added button to select it.

#### Step 3: Configure the Button to Show an Alert
1. In the property pane on the right side, find the **onClick** property.
2. Click on the **JS** button next to the **onClick** field to switch to JavaScript mode.
3. Enter the following JavaScript code snippet:

\`\`\`javascript
{{showAlert("This is an alert message!", "info")}}
\`\`\`

Here, \`showAlert\` takes two arguments:
- The first argument is the message string you want to display.
- The second argument is the type of alert (\`info\`, \`success\`, \`warning\`, or \`error\`), which affects the icon and color of the alert.

#### Step 4: Test the Alert
1. Click the **Deploy** button in the top right corner to deploy your changes.
2. Now, click the button on your live app. You should see an alert at the top of the screen displaying "This is an alert message!" with an information icon.

#### Customizing the Alert
You can customize the message and the type of the alert based on your application's needs. Here are examples of different alert types:

- **Success Alert:**
  \`\`\`javascript
  {{showAlert("Operation completed successfully!", "success")}}
  \`\`\`
- **Warning Alert:**
  \`\`\`javascript
  {{showAlert("Warning: Please check your entries!", "warning")}}
  \`\`\`
- **Error Alert:**
  \`\`\`javascript
  {{showAlert("Error: Something went wrong!", "error")}}
  \`\`\`

### Conclusion
Using the \`showAlert\` function in Appsmith is an effective way to provide immediate feedback to users in your application. By following the steps above, you can implement various types of alerts based on different user interactions within your Appsmith applications.
      `,
    },
  ]);
};

export const sendMessage = async (message: string): Promise<Message> => {
  // Replace with actual API call
  // For demonstration, returning the sent message
  return Promise.resolve({
    id: "msg3",
    sender: "user",
    content: message,
    date: new Date().toISOString(),
  });
};
