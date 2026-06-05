export type CanvasInitialDocument = {
  appState: {
    gridModeEnabled: boolean;
    gridSize: number;
    gridStep: number;
    viewBackgroundColor: string;
  };
};

export function createInitialCanvasDocument(): CanvasInitialDocument {
  return {
    appState: {
      gridModeEnabled: true,
      gridSize: 36,
      gridStep: 1,
      viewBackgroundColor: "#f7f8fa",
    },
  };
}
