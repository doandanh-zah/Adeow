"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ComponentProps } from "react";
import {
  CanvasTopRightControls,
  type CanvasAuthUser,
} from "@/components/canvas/CanvasTopRightControls";
import { saveCanvasDocumentToDB } from "@/lib/supabase/canvases";
import { getCanvasStorageKey, type CanvasInitialDocument } from "./document";

type CanvasEngineProps = {
  canvasId: string;
  initialData: CanvasInitialDocument;
  initialUser: CanvasAuthUser;
};

export const CanvasEngine = dynamic<CanvasEngineProps>(
  async () => {
    const canvasSdk = (await import("./excalidraw-runtime-entry.js")) as typeof import("@excalidraw/excalidraw");
    const {
      Excalidraw,
      MainMenu,
      WelcomeScreen,
      defaultLang,
      restore,
      serializeAsJSON,
    } = canvasSdk;
    // Use the patched development runtime until the local fork is wired into the app.
    const { DefaultItems } = MainMenu;
    type CanvasApi = Parameters<
      NonNullable<ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
    >[0];
    type CanvasTheme = NonNullable<ComponentProps<typeof Excalidraw>["theme"]>;
    type CanvasAppState = Parameters<
      NonNullable<ComponentProps<typeof Excalidraw>["renderTopRightUI"]>
    >[1];
    type CanvasOnChange = NonNullable<
      ComponentProps<typeof Excalidraw>["onChange"]
    >;
    type CanvasElements = Parameters<CanvasOnChange>[0];
    type CanvasSceneAppState = Parameters<CanvasOnChange>[1];
    type CanvasFiles = Parameters<CanvasOnChange>[2];
    type RestorableScene = Parameters<typeof restore>[0];
    type SupportedLangCode = "en" | "vi-VN";

    const supportedLanguages: Array<{
      code: SupportedLangCode;
      label: string;
    }> = [
      { code: "en", label: "English" },
      { code: "vi-VN", label: "Tiếng Việt" },
    ];
    const menuCopy: Record<
      SupportedLangCode,
      {
        openFile: string;
        saveFile: string;
        language: string;
      }
    > = {
      en: {
        openFile: "Open file",
        saveFile: "Save .adeow",
        language: "Language",
      },
      "vi-VN": {
        openFile: "Mở tệp",
        saveFile: "Lưu .adeow",
        language: "Ngôn ngữ",
      },
    };

    const sanitizeFilename = (value: string) => {
      const normalized = value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-");
      return normalized || "adeow-canvas";
    };
    const isCanvasTheme = (value: unknown): value is CanvasTheme => {
      return value === "light" || value === "dark";
    };
    const isLibrarySidebarOpen = (appState: CanvasAppState) => {
      return (
        appState.openSidebar?.name === "default" &&
        appState.openSidebar.tab === "library"
      );
    };

    return function CanvasEngineRuntime({
      canvasId,
      initialData,
      initialUser,
    }: CanvasEngineProps) {
      const apiRef = useRef<CanvasApi | null>(null);
      const fileInputRef = useRef<HTMLInputElement | null>(null);
      const saveTimeoutRef = useRef<number | null>(null);
      const [theme, setTheme] = useState<CanvasTheme>(
        isCanvasTheme(initialData.appState?.theme)
          ? initialData.appState.theme
          : "light",
      );
      const [langCode, setLangCode] = useState<SupportedLangCode>(
        defaultLang.code === "vi-VN" ? "vi-VN" : "en",
      );
      const copy = menuCopy[langCode];

      useEffect(() => {
        return () => {
          if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
          }
        };
      }, []);

      const persistScene = (
        elements: CanvasElements,
        appState: CanvasSceneAppState,
        files: CanvasFiles,
      ) => {
        if (typeof window === "undefined") {
          return;
        }

        const payload = serializeAsJSON(elements, appState, files, "local");
        void saveCanvasDocumentToDB(canvasId, payload).then((didSaveToDB) => {
          if (didSaveToDB) {
            window.localStorage.removeItem(getCanvasStorageKey(canvasId));
            return;
          }

          window.localStorage.setItem(getCanvasStorageKey(canvasId), payload);
        });
      };

      const scheduleScenePersist = (
        elements: CanvasElements,
        appState: CanvasSceneAppState,
        files: CanvasFiles,
      ) => {
        if (typeof window === "undefined") {
          return;
        }

        if (saveTimeoutRef.current !== null) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
          persistScene(elements, appState, files);
        }, 250);
      };

      const handleOpenClick = () => {
        fileInputRef.current?.click();
      };

      const handleSaveClick = () => {
        const api = apiRef.current;

        if (!api) {
          return;
        }

        const filename = `${sanitizeFilename(api.getName())}.adeow`;
        const payload = serializeAsJSON(
          api.getSceneElementsIncludingDeleted(),
          api.getAppState(),
          api.getFiles(),
          "local",
        );
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      };

      const handleOpenFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const api = apiRef.current;
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!api || !file) {
          return;
        }

        try {
          const text = await file.text();
          const parsedValue = JSON.parse(text) as Partial<RestorableScene> | null;

          if (!parsedValue || typeof parsedValue !== "object") {
            throw new Error("Invalid scene payload");
          }

          const parsed = parsedValue;
          const restored = restore(
            {
              appState: parsed.appState,
              elements: Array.isArray(parsed.elements) ? parsed.elements : undefined,
              files:
                parsed.files && typeof parsed.files === "object"
                  ? parsed.files
                  : undefined,
            },
            api.getAppState(),
            api.getSceneElementsIncludingDeleted(),
          );

          api.updateScene({
            elements: restored.elements,
            appState: restored.appState,
          });
          if (restored.files) {
            api.addFiles(Object.values(restored.files));
          }
          if (isCanvasTheme(restored.appState?.theme)) {
            setTheme(restored.appState.theme);
          }
          api.history.clear();
        } catch {
          api.setToast({
            message: "Could not open this file.",
          });
        }
      };

      const handleToggleLibrary = (isOpen: boolean) => {
        const api = apiRef.current;

        if (!api) {
          return;
        }

        api.toggleSidebar({
          name: "default",
          tab: "library",
          force: isOpen ? false : true,
        });
      };

      return (
        <Excalidraw
          initialData={
            initialData as NonNullable<
              ComponentProps<typeof Excalidraw>["initialData"]
            >
          }
          name="ADEOW"
          theme={theme}
          langCode={langCode}
          onChange={(elements, appState, files) => {
            scheduleScenePersist(elements, appState, files);
          }}
          excalidrawAPI={(api) => {
            apiRef.current = api;
          }}
          gridModeEnabled
          renderTopRightUI={(_isMobile, appState) => (
            <CanvasTopRightControls
              initialUser={initialUser}
              isLibraryOpen={isLibrarySidebarOpen(appState)}
              langCode={langCode}
              onToggleLibrary={() =>
                handleToggleLibrary(isLibrarySidebarOpen(appState))
              }
            />
          )}
          UIOptions={{
            canvasActions: {
              export: {},
              saveToActiveFile: false,
              saveAsImage: true,
              toggleTheme: true,
              changeViewBackgroundColor: true,
            },
          }}
        >
          <MainMenu>
            <MainMenu.Item onSelect={handleOpenClick}>
              {copy.openFile}
            </MainMenu.Item>
            <MainMenu.Item onSelect={handleSaveClick}>
              {copy.saveFile}
            </MainMenu.Item>
            <MainMenu.Separator />
            <DefaultItems.Export />
            <DefaultItems.SaveAsImage />
            <DefaultItems.Help />
            <DefaultItems.SearchMenu />
            <DefaultItems.ClearCanvas />
            <MainMenu.Group title={copy.language}>
              {supportedLanguages.map((language) => (
                <MainMenu.Item
                  key={language.code}
                  onSelect={() => setLangCode(language.code)}
                  selected={langCode === language.code}
                >
                  {language.label}
                </MainMenu.Item>
              ))}
            </MainMenu.Group>
            <MainMenu.Separator />
            <DefaultItems.ToggleTheme
              onSelect={(nextTheme) => setTheme(nextTheme)}
            />
            <DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          <input
            accept=".adeow,.excalidraw,.json,application/json"
            className="hidden"
            onChange={handleOpenFile}
            ref={fileInputRef}
            type="file"
          />
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
