// Check if user is updating the app when toast is shown
// Check how many times does the user see a toast before updating
class VersionUpdatePrompt {
  version: string;
  shown = 0;

  constructor(version: string) {
    this.version = version;
    // get the current stats from local storage
    // check if current version is same and if reload was clicked
  }

  private showUpdate() {
    // fetch current times shown number
    // update shown number
  }

  markUpdateClicked() {
    // set localstorage that the reload was initiated
  }
}

export default VersionUpdatePrompt;
