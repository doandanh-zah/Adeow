"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { CanvasInitialDocument } from "./document";

type CanvasEngineProps = {
  initialData: CanvasInitialDocument;
};

export const CanvasEngine = dynamic<CanvasEngineProps>(
  async () => {
    const canvasSdk = await import("@excalidraw/excalidraw");
    const { Excalidraw, MainMenu, WelcomeScreen } = canvasSdk;
    const CanvasMenu = MainMenu as typeof MainMenu & {
      DefaultItems: typeof MainMenu.DefaultItems & {
        Preferences: ((props: { children?: ReactNode }) => ReactNode) & {
          ToggleToolLock: () => ReactNode;
          ToggleSnapMode: () => ReactNode;
          ToggleGridMode: () => ReactNode;
          ToggleZenMode: () => ReactNode;
          ToggleElementProperties: () => ReactNode;
        };
      };
    };

    return function CanvasEngineRuntime({ initialData }: CanvasEngineProps) {
      return (
        <Excalidraw
          initialData={initialData}
          name="ADEOW"
          theme="light"
          UIOptions={{
            canvasActions: {
              export: false,
              saveAsImage: false,
              toggleTheme: false,
              changeViewBackgroundColor: false,
            },
          }}
        >
          <CanvasMenu>
            <CanvasMenu.DefaultItems.LoadScene />
            <CanvasMenu.DefaultItems.SaveToActiveFile />
            <CanvasMenu.Separator />
            <CanvasMenu.DefaultItems.SearchMenu />
            <CanvasMenu.DefaultItems.ClearCanvas />
            <CanvasMenu.Separator />
            <CanvasMenu.DefaultItems.Preferences>
              <CanvasMenu.DefaultItems.Preferences.ToggleToolLock />
              <CanvasMenu.DefaultItems.Preferences.ToggleSnapMode />
              <CanvasMenu.DefaultItems.Preferences.ToggleGridMode />
              <CanvasMenu.DefaultItems.Preferences.ToggleZenMode />
              <CanvasMenu.DefaultItems.Preferences.ToggleElementProperties />
            </CanvasMenu.DefaultItems.Preferences>
          </CanvasMenu>
          <WelcomeScreen>
            <></>
          </WelcomeScreen>
        </Excalidraw>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-slate-200" />
          <p className="font-mono text-sm text-muted-foreground">
            Loading canvas engine...
          </p>
        </div>
      </div>
    ),
  },
);
