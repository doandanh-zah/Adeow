"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ComponentProps } from "react";
import {
  AdeowCanvasEmbeddable,
  createCodeBlockData,
  createInitialSheetData,
  createStickyNoteData,
  estimateCodeBlockSize,
  estimateSheetSize,
  estimateStickyNoteSize,
  getAdeowEmbeddableData,
  inferCodeLanguage,
  type AdeowEmbeddableData,
} from "@/components/canvas/AdeowCanvasEmbeddables";
import {
  AdeowCanvasToolbar,
  type AdeowCanvasToolType,
  type AdeowDrawMode,
  type AdeowLineVariant,
} from "@/components/canvas/AdeowCanvasToolbar";
import {
  CanvasTopRightControls,
  type CanvasAuthUser,
} from "@/components/canvas/CanvasTopRightControls";
import { getCanvasTitle, saveCanvasDocumentToDB } from "@/lib/supabase/canvases";
import type { CanvasLanguageCode, CanvasTheme } from "@/lib/canvas-core/ui";
import {
  getCanvasStorageKey,
  type CanvasInitialDocument,
  upsertLocalCanvasDirectoryEntry,
} from "./document";

type CanvasEngineProps = {
  canvasId: string;
  initialData: CanvasInitialDocument;
  initialUser: CanvasAuthUser;
  langCode: CanvasLanguageCode;
  onLangCodeChange: (langCode: CanvasLanguageCode) => void;
  onThemeChange: (theme: CanvasTheme) => void;
  theme: CanvasTheme;
};

export const CanvasEngine = dynamic<CanvasEngineProps>(
  async () => {
    const canvasSdk = (await import("./excalidraw-runtime-entry.js")) as typeof import("@excalidraw/excalidraw");
    const {
      Excalidraw,
      MainMenu,
      WelcomeScreen,
      CaptureUpdateAction,
      FONT_FAMILY,
      ROUNDNESS,
      convertToExcalidrawElements,
      newElementWith,
      restore,
      serializeAsJSON,
    } = canvasSdk;
    // Use the patched development runtime until the local fork is wired into the app.
    const { DefaultItems } = MainMenu;
    type CanvasApi = Parameters<
      NonNullable<ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
    >[0];
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
    type GeneratedCanvasElement = ReturnType<
      typeof convertToExcalidrawElements
    >[number];
    type CanvasTextLineHeight = Extract<
      GeneratedCanvasElement,
      { type: "text" }
    >["lineHeight"];

    const supportedLanguages: Array<{
      code: CanvasLanguageCode;
      label: string;
    }> = [
      { code: "en", label: "English" },
      { code: "vi-VN", label: "Tiếng Việt" },
    ];
    const menuCopy: Record<
      CanvasLanguageCode,
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
    const unitlessLineHeight = (value: number) => value as CanvasTextLineHeight;

    return function CanvasEngineRuntime({
      canvasId,
      initialData,
      initialUser,
      langCode,
      onLangCodeChange,
      onThemeChange,
      theme,
    }: CanvasEngineProps) {
      const apiRef = useRef<CanvasApi | null>(null);
      const codeFileInputRef = useRef<HTMLInputElement | null>(null);
      const fileInputRef = useRef<HTMLInputElement | null>(null);
      const saveTimeoutRef = useRef<number | null>(null);
      const [activeToolType, setActiveToolType] =
        useState<CanvasAppState["activeTool"]["type"]>("selection");
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
          upsertLocalCanvasDirectoryEntry({
            id: canvasId,
            title: getCanvasTitle(canvasId),
          });
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
            onThemeChange(restored.appState.theme);
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

      const getAuthorLabel = () => {
        const fullName =
          typeof initialUser?.user_metadata?.full_name === "string"
            ? initialUser.user_metadata.full_name.trim()
            : "";

        if (fullName) {
          return fullName;
        }

        if (initialUser?.email) {
          return initialUser.email.split("@")[0];
        }

        return "Guest";
      };

      const createGroupId = () => {
        if (
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
        ) {
          return crypto.randomUUID();
        }

        return `adeow-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2)}`;
      };

      const createSeed = () => Math.floor(Math.random() * 2_000_000_000) + 1;

      const createAdeowEmbeddableElement = ({
        data,
        height,
        kind,
        width,
      }: {
        data: AdeowEmbeddableData;
        height: number;
        kind: AdeowEmbeddableData["kind"];
        width: number;
      }) => {
        const id = createGroupId();
        const { x, y } = getViewportCenter(width, height);

        return {
          angle: 0,
          backgroundColor: "transparent",
          boundElements: null,
          customData: {
            adeowEmbeddable: data,
          },
          fillStyle: "solid",
          frameId: null,
          groupIds: [],
          height,
          id,
          index: null,
          isDeleted: false,
          link: `https://adeow.local/${kind}/${id}`,
          locked: false,
          opacity: 100,
          roughness: 0,
          roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
          seed: createSeed(),
          strokeColor:
            kind === "codeblock"
              ? "#181b25"
              : kind === "sticky"
                ? "#d6b44f"
                : "#94a3b8",
          strokeStyle: "solid",
          strokeWidth: kind === "codeblock" ? 2 : 1,
          type: "embeddable",
          updated: Date.now(),
          version: 1,
          versionNonce: createSeed(),
          width,
          x,
          y,
        } as unknown as GeneratedCanvasElement;
      };

      const getViewportCenter = (width: number, height: number) => {
        const api = apiRef.current;
        const appState = api?.getAppState();
        const zoomValue =
          typeof appState?.zoom?.value === "number" && appState.zoom.value > 0
            ? appState.zoom.value
            : 1;
        const viewportWidth =
          typeof appState?.width === "number" ? appState.width : window.innerWidth;
        const viewportHeight =
          typeof appState?.height === "number"
            ? appState.height
            : window.innerHeight;
        const scrollX =
          typeof appState?.scrollX === "number" ? appState.scrollX : 0;
        const scrollY =
          typeof appState?.scrollY === "number" ? appState.scrollY : 0;

        return {
          x: viewportWidth / (2 * zoomValue) - scrollX - width / 2,
          y: viewportHeight / (2 * zoomValue) - scrollY - height / 2,
        };
      };

      const updateCurrentItemStyle = (
        appState: Partial<CanvasSceneAppState>,
      ) => {
        const api = apiRef.current;

        if (!api) {
          return;
        }

        api.updateScene({
          appState: appState as unknown as CanvasSceneAppState,
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
        });
      };

      const insertGeneratedElements = (
        generatedElements: GeneratedCanvasElement[],
        message: string,
      ) => {
        const api = apiRef.current;

        if (!api || generatedElements.length === 0) {
          return;
        }

        const selectedElementIds = generatedElements.reduce<
          Record<string, true>
        >((ids, element) => {
          ids[element.id] = true;
          return ids;
        }, {});

        api.updateScene({
          elements: [
            ...api.getSceneElementsIncludingDeleted(),
            ...generatedElements,
          ] as CanvasElements,
          appState: {
            selectedElementIds,
          } as unknown as CanvasSceneAppState,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        api.setActiveTool({ type: "selection" });
        setActiveToolType("selection");
        api.setToast({ message });
      };

      const handleEmbeddableDataChange = (
        elementId: string,
        data: AdeowEmbeddableData,
        size?: { height: number; width: number },
      ) => {
        const api = apiRef.current;

        if (!api) {
          return;
        }

        const elements = api.getSceneElementsIncludingDeleted().map((element) => {
          if (element.id !== elementId) {
            return element;
          }

          return newElementWith(
            element,
            {
              customData: {
                ...element.customData,
                adeowEmbeddable: data,
              },
              height: size ? Math.max(element.height, size.height) : element.height,
              strokeColor:
                data.kind === "codeblock"
                  ? "#181b25"
                  : data.kind === "sticky"
                    ? "#d6b44f"
                    : element.strokeColor,
              width: size ? Math.max(element.width, size.width) : element.width,
            } as Partial<typeof element>,
            true,
          );
        });

        api.updateScene({
          elements,
          captureUpdate: CaptureUpdateAction.EVENTUALLY,
        });
      };

      const handleToolbarSelectTool = (
        tool: AdeowCanvasToolType,
        options?: {
          drawMode?: AdeowDrawMode;
          lineVariant?: AdeowLineVariant;
        },
      ) => {
        const api = apiRef.current;

        if (!api) {
          return;
        }

        if (tool === "freedraw") {
          const isHighlighter = options?.drawMode === "highlighter";

          updateCurrentItemStyle({
            currentItemOpacity: isHighlighter ? 45 : 100,
            currentItemStrokeWidth: isHighlighter ? 8 : 2,
          } as Partial<CanvasSceneAppState>);
        }

        if (
          tool === "rectangle" ||
          tool === "diamond" ||
          tool === "ellipse" ||
          tool === "line" ||
          tool === "arrow" ||
          tool === "text"
        ) {
          updateCurrentItemStyle({
            currentItemArrowType:
              options?.lineVariant === "connector" ? "elbow" : "round",
          } as Partial<CanvasSceneAppState>);
        }

        if (tool === "image") {
          api.setActiveTool({ type: "image", insertOnCanvasDirectly: false });
          setActiveToolType("image");
          return;
        }

        api.setActiveTool({ type: tool });
        setActiveToolType(tool);
      };

      const getCurrentStickyColor = () => {
        const appState = apiRef.current?.getAppState();
        const backgroundColor = appState?.currentItemBackgroundColor;

        return backgroundColor && backgroundColor !== "transparent"
          ? backgroundColor
          : "#fff3bf";
      };

      const getCurrentStrokeColor = () => {
        return apiRef.current?.getAppState().currentItemStrokeColor || "#111827";
      };

      const handleInsertStickyNote = () => {
        const data = createStickyNoteData({
          author: getAuthorLabel(),
          color: getCurrentStickyColor(),
          text: "",
        });
        const size = estimateStickyNoteSize();
        const element = createAdeowEmbeddableElement({
          data,
          height: size.height,
          kind: "sticky",
          width: size.width,
        });

        insertGeneratedElements([element], "Sticky note added.");
      };

      const handleInsertStamp = (stamp: string) => {
        const isWordStamp = stamp.length > 2;
        const width = isWordStamp ? 156 : 86;
        const height = 86;
        const { x, y } = getViewportCenter(width, height);
        const groupId = createGroupId();
        const strokeColor = getCurrentStrokeColor();
        const elements = convertToExcalidrawElements(
          [
            {
              type: isWordStamp ? "rectangle" : "ellipse",
              x,
              y,
              width,
              height,
              backgroundColor: "transparent",
              fillStyle: "solid",
              groupIds: [groupId],
              opacity: 100,
              roughness: 0,
              roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
              strokeColor,
              strokeWidth: 3,
            },
            {
              type: "text",
              text: stamp,
              x: x + 8,
              y: y + (isWordStamp ? 26 : 15),
              width: width - 16,
              height: isWordStamp ? 34 : 56,
              backgroundColor: "transparent",
              fontFamily: FONT_FAMILY["Comic Shanns"],
              fontSize: isWordStamp ? 26 : 42,
              groupIds: [groupId],
              lineHeight: unitlessLineHeight(1.2),
              opacity: 100,
              strokeColor,
              textAlign: "center",
              verticalAlign: "middle",
            },
          ],
          { regenerateIds: true },
        );

        insertGeneratedElements(elements, "Stamp added.");
      };

      const handleInsertSheet = () => {
        const data = createInitialSheetData();
        const size =
          data.kind === "sheet"
            ? estimateSheetSize(data.sheet)
            : { height: 220, width: 420 };
        const element = createAdeowEmbeddableElement({
          data,
          height: size.height,
          kind: "sheet",
          width: size.width,
        });

        insertGeneratedElements([element], "Sheet added.");
      };

      const handleInsertCodeBlock = () => {
        const data = createCodeBlockData();
        const size =
          data.kind === "codeblock"
            ? estimateCodeBlockSize(data.codeBlock.code)
            : { height: 220, width: 420 };
        const element = createAdeowEmbeddableElement({
          data,
          height: size.height,
          kind: "codeblock",
          width: size.width,
        });

        insertGeneratedElements([element], "Code block added.");
      };

      const handleInsertCodeFileClick = () => {
        codeFileInputRef.current?.click();
      };

      const handleOpenCodeFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) {
          return;
        }

        try {
          const code = await file.text();
          const data = createCodeBlockData({
            code,
            filename: file.name,
            language: inferCodeLanguage(file.name),
          });
          const size =
            data.kind === "codeblock"
              ? estimateCodeBlockSize(data.codeBlock.code)
              : { height: 220, width: 420 };
          const element = createAdeowEmbeddableElement({
            data,
            height: size.height,
            kind: "codeblock",
            width: size.width,
          });

          insertGeneratedElements([element], "Code file added.");
        } catch {
          apiRef.current?.setToast({
            message: "Could not read this code file.",
          });
        }
      };

      return (
        <div className="adeow-canvas-engine-shell">
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
              setActiveToolType((currentToolType) =>
                currentToolType === appState.activeTool.type
                  ? currentToolType
                  : appState.activeTool.type,
              );
              scheduleScenePersist(elements, appState, files);
            }}
            excalidrawAPI={(api) => {
              apiRef.current = api;
            }}
            gridModeEnabled
            renderEmbeddable={(element) =>
              getAdeowEmbeddableData(element.customData) ? (
                <AdeowCanvasEmbeddable
                  element={element}
                  onChange={handleEmbeddableDataChange}
                  theme={theme}
                />
              ) : null
            }
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
            validateEmbeddable={(link) =>
              link.startsWith("https://adeow.local/") ? true : undefined
            }
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
                    onSelect={() => onLangCodeChange(language.code)}
                    selected={langCode === language.code}
                  >
                    {language.label}
                  </MainMenu.Item>
                ))}
              </MainMenu.Group>
              <MainMenu.Separator />
              <DefaultItems.ToggleTheme
                onSelect={(nextTheme) => onThemeChange(nextTheme)}
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
            <input
              accept=".js,.jsx,.ts,.tsx,.mjs,.cjs,.py,.java,.cs,.cpp,.cc,.cxx,.hpp,.hh,.hxx,.c,.h,.go,.rs,.php,.rb,.swift,.kt,.kts,.sql,.sh,.bash,.zsh,.fish,.css,.scss,.sass,.html,.htm,.xml,.svg,.json,.yaml,.yml,.md,.mdx,.dart,.lua,.r,.txt,text/*,application/json"
              className="hidden"
              onChange={handleOpenCodeFile}
              ref={codeFileInputRef}
              type="file"
            />
            <WelcomeScreen>
              <></>
            </WelcomeScreen>
          </Excalidraw>
          <AdeowCanvasToolbar
            activeToolType={activeToolType}
            langCode={langCode}
            onInsertCodeBlock={handleInsertCodeBlock}
            onInsertCodeFile={handleInsertCodeFileClick}
            onInsertSheet={handleInsertSheet}
            onInsertStamp={handleInsertStamp}
            onInsertStickyNote={handleInsertStickyNote}
            onSelectTool={handleToolbarSelectTool}
            theme={theme}
          />
        </div>
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
