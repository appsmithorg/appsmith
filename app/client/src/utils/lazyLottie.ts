import type {
  AnimationConfigWithPath,
  AnimationItem,
  LottiePlayer,
} from "lottie-web";

let cachedLottie: LottiePlayer | null = null;

export type LazyAnimationItem = Pick<
  AnimationItem,
  "play" | "addEventListener" | "destroy" | "goToAndStop"
>;

const lazyLottie = {
  loadAnimation: (
    // Note: explicitly not using the `AnimationConfigWithData` type here because we want all animations
    // to be passed as URLs (`path: ...`), not as objects (`animationData: ...`). To pass an animation as an object,
    // you need to bundle it, which makes the bundle larger.
    //
    // If you’re a developer who wants to play a Lottie animation, please import the animation as a `.txt` file:
    //
    //   import animationURL from "./animation.json.txt";
    //
    //  and pass it as the `path` prop:
    //
    //   lazyLottie.loadAnimation({ path: animationURL, ... });
    params: AnimationConfigWithPath,
  ): LazyAnimationItem => {
    if (cachedLottie) {
      return cachedLottie.loadAnimation(params);
    }

    const abortController = new AbortController();
    const queuedCommands: Array<{
      commandName: "play" | "addEventListener" | "goToAndStop";
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: any[];
    }> = [];

    import("lottie-web").then(({ default: lottie }) => {
      if (abortController.signal.aborted) {
        return;
      }

      cachedLottie = lottie;
      const animation = lottie.loadAnimation(params);

      for (const command of queuedCommands) {
        // @ts-expect-error – Getting “A spread argument must either have a tuple type or be passed to a rest parameter”, and it’s tricky to work around with this generalized code
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        animation[command.commandName](...(command.args as any));
      }
    });

    return {
      play(...args) {
        queuedCommands.push({ commandName: "play", args });
      },
      addEventListener(...args) {
        queuedCommands.push({ commandName: "addEventListener", args });

        return () => {
          throw new Error("Not implemented");
        };
      },
      goToAndStop(...args) {
        queuedCommands.push({ commandName: "goToAndStop", args });
      },
      destroy() {
        abortController.abort();
      },
    };
  },
};

export default lazyLottie;
