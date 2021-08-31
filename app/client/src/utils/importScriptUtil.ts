import { ExtraLibrary, defaultLibraries } from "utils/ExtraLibrary";

export class ScriptService {
  private static instance: ScriptService;
  private scripts: any = {};

  private constructor(libraries: ExtraLibrary[]) {
    libraries.forEach((script: any) => {
      this.scripts[script.displayName] = this.scripts[script.displayName] || {
        loaded: true,
        src: script.src,
      };
    });
  }

  public static getInstance() {
    if (!ScriptService.instance)
      ScriptService.instance = new ScriptService(defaultLibraries);
    return ScriptService.instance;
  }

  public load(customLibs: any) {
    const promises: any[] = [];
    (customLibs || []).forEach((script: any) => {
      this.scripts[script.name] = this.scripts[script.name] || {
        loaded: false,
        src: script.latest,
      };
      promises.push(this.loadScript(script.name));
    });
    return Promise.all(promises);
  }

  private loadScript(name: string) {
    return new Promise((resolve, reject) => {
      //resolve if already loaded
      if (this.scripts[name].loaded) {
        resolve({ script: name, loaded: true, status: "Already Loaded" });
      } else {
        //load script
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = this.scripts[name].src;
        //Others
        script.onload = () => {
          this.scripts[name].loaded = true;
          resolve({ script: name, loaded: true, status: "Loaded" });
        };
        script.onerror = (error: any) =>
          resolve({ script: name, loaded: false, status: "Loaded" });
        document.body.appendChild(script);
      }
    });
  }
}

export default ScriptService;
