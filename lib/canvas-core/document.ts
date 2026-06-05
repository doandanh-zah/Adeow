export type CanvasInitialDocument = {
  appState: {
    viewBackgroundColor: string;
  };
};

export function createInitialCanvasDocument(): CanvasInitialDocument {
  return {
    appState: {
      viewBackgroundColor: "#ffffff",
    },
  };
}
