/***
 * Product update is used to show a fixed banner to (all) users at the bottom
 * of the screen. It should only be shown to
 *
 */

interface ProductUpdate {
  id: string; // ID is important for dismissal and remindLater to work
  enabled: boolean; // Won't be shown till this is true
  title: string;
  message: string;
  learnMoreLink: string;
  canDismiss: boolean; // Can the user close this message.
  remindLaterDays?: number; // If the user chooses to remind later, // it will be shown again after these many days
}

const update: ProductUpdate = {
  enabled: false,
  id: "1",
  title: "Test issue",
  message:
    "Something is wrong. Lorem ipsum something something. You need to learn this",
  learnMoreLink: "https://docs.appsmith.com",
  canDismiss: true,
  remindLaterDays: 1,
};

export default update;
