"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CanvasLanguageCode, CanvasTheme } from "@/lib/canvas-core/ui";

export type AdeowCanvasToolType =
  | "selection"
  | "hand"
  | "freedraw"
  | "eraser"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "image"
  | "frame"
  | "embeddable"
  | "laser"
  | "magicframe";

export type AdeowDrawMode = "marker" | "highlighter";
export type AdeowLineVariant = "line" | "arrow" | "connector";

type AdeowCanvasToolbarProps = {
  activeToolType: string;
  langCode: CanvasLanguageCode;
  theme: CanvasTheme;
  onInsertCodeBlock: () => void;
  onInsertCodeFile: () => void;
  onInsertSheet: () => void;
  onInsertStamp: (stamp: string) => void;
  onInsertStickyNote: () => void;
  onSelectTool: (
    tool: AdeowCanvasToolType,
    options?: {
      drawMode?: AdeowDrawMode;
      lineVariant?: AdeowLineVariant;
    },
  ) => void;
};

type PanelId = "draw" | "shape" | "stamp" | "codeBlock" | "more";

const stamps = [
  { label: "Approved", value: "✓" },
  { label: "Rejected", value: "✕" },
  { label: "Done", value: "DONE" },
  { label: "Review", value: "REVIEW" },
  { label: "Waiting", value: "⏳" },
  { label: "Time", value: "🕒" },
  { label: "Like", value: "👍" },
  { label: "Love", value: "❤️" },
  { label: "Star", value: "⭐" },
  { label: "Fire", value: "🔥" },
  { label: "Launch", value: "🚀" },
  { label: "Idea", value: "💡" },
  { label: "Watch", value: "👀" },
  { label: "Warning", value: "⚠" },
  { label: "Important", value: "!" },
  { label: "Question", value: "?" },
  { label: "Pin", value: "📌" },
  { label: "Bug", value: "🐞" },
];

const labels = {
  en: {
    select: "Select",
    hand: "Hand tool",
    marker: "Marker",
    highlighter: "Highlighter",
    eraser: "Eraser",
    drawTools: "Draw tools",
    sticky: "Sticky note",
    shapeLine: "Shape and line",
    rectangle: "Rectangle",
    diamond: "Diamond",
    ellipse: "Ellipse",
    line: "Line",
    arrow: "Arrow",
    connector: "Connector",
    text: "Text",
    image: "Image",
    sheet: "Sheet",
    stamp: "Stamp",
    codeBlock: "Code block",
    addCodeBlock: "Add new code block",
    addCodeFile: "Add file code",
    more: "More tools",
    frame: "Frame",
    webEmbed: "Web embed",
    laser: "Laser pointer",
    mermaid: "Mermaid / magic frame",
  },
  "vi-VN": {
    select: "Chọn",
    hand: "Di chuyển canvas",
    marker: "Bút vẽ",
    highlighter: "Bút đánh dấu",
    eraser: "Tẩy",
    drawTools: "Công cụ vẽ",
    sticky: "Ghi chú",
    shapeLine: "Hình và đường nối",
    rectangle: "Hình chữ nhật",
    diamond: "Hình thoi",
    ellipse: "Hình tròn",
    line: "Đường thẳng",
    arrow: "Mũi tên",
    connector: "Connector",
    text: "Chữ",
    image: "Ảnh",
    sheet: "Bảng",
    stamp: "Dấu",
    codeBlock: "Khối code",
    addCodeBlock: "Tạo khối code mới",
    addCodeFile: "Thêm file code",
    more: "Công cụ khác",
    frame: "Frame",
    webEmbed: "Nhúng web",
    laser: "Laser",
    mermaid: "Mermaid / magic frame",
  },
} as const;

function isNode(value: EventTarget | null): value is Node {
  return value instanceof Node;
}

function SelectIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m5.2 3.8 13.9 7.4-6.1 1.9-2.8 5.6L5.2 3.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M7.6 11V8.4a1.3 1.3 0 1 1 2.6 0v2.1m0 .5V6.7a1.3 1.3 0 1 1 2.6 0v4.1m0-.1V8a1.3 1.3 0 1 1 2.6 0v3.8m0-.1v-1.4a1.3 1.3 0 1 1 2.6 0v5.1c0 3.4-2.2 5.4-5.8 5.4h-.7c-2.2 0-3.8-.8-5-2.6l-2.2-3.4a1.45 1.45 0 0 1 2.4-1.6l1.3 1.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MarkerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12.2 3.1 16 9.3l-2 10.2H7.8l-2-10.2 3.8-6.2h2.6Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M9.6 3.1h2.6L16 9.3l-2 10.2H7.8l-2-10.2 3.8-6.2Zm-3.4 6.2h9.4M8 19.5h5.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function HighlighterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m14.4 4.4 5.2 5.2-8.5 8.5H6v-5.1l8.4-8.6Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="m14.4 4.4 5.2 5.2-8.5 8.5H6v-5.1l8.4-8.6Zm-2.3 2.4 5.1 5.1M4.6 20h14.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m8.1 17.2-3.2-3.1a2 2 0 0 1 0-2.8l6.9-6.9a2 2 0 0 1 2.8 0l4.5 4.5a2 2 0 0 1 0 2.8l-5.5 5.5H8.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m9.1 7.1 7.8 7.8M6.8 19.8h11.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function StickyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M6 4.8h12v9.5L13.3 19H6V4.8Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M6 4.8h12v9.5L13.3 19H6V4.8Zm7.4 14.1v-4.5h4.5"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ShapeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5 5.5h7v7H5v-7Zm10.5 1.2h3.8m-1.9-1.9v3.8M6 18h4.4m2.8 0h4.8m-2.4-2.4L18 18l-2.4 2.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5 6h14M12 6v12M8.7 18h6.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M5 6h14v12H5V6Zm2.5 9 3.1-3.2 2.3 2.1 1.4-1.5L17 15M15.8 9.2h.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SheetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4.8 5.5h14.4v13H4.8v-13Zm0 4.3h14.4M4.8 14h14.4M9.6 5.5v13m4.8-13v13"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function StampIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M9 5.8a3 3 0 0 1 6 0v4.8l2.2 2.1v2.1H6.8v-2.1L9 10.6V5.8Zm-3.1 12.4h12.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="m9 8-4 4 4 4m6-8 4 4-4 4m-1.5-10-3 12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 5h12v10H4V5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="m10 3.8 6.2 6.2-6.2 6.2L3.8 10 10 3.8Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function EllipseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M3.6 10a6.4 5.2 0 1 0 12.8 0 6.4 5.2 0 0 0-12.8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 15.5 16 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 15.5 15.5 4M9.4 4h6.1v6.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ConnectorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path
        d="M4 5h5.5v9H16m0 0-2.4-2.4M16 14l-2.4 2.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ToolbarButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="adeow-canvas-tool-button"
      data-active={active ? "true" : "false"}
      data-tooltip={label}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function MenuButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="adeow-canvas-toolbar-menu-button"
      onClick={onClick}
      type="button"
    >
      <span className="adeow-canvas-toolbar-menu-icon">{children}</span>
      <span>{label}</span>
    </button>
  );
}

export function AdeowCanvasToolbar({
  activeToolType,
  langCode,
  onInsertCodeBlock,
  onInsertCodeFile,
  onInsertSheet,
  onInsertStamp,
  onInsertStickyNote,
  onSelectTool,
  theme,
}: AdeowCanvasToolbarProps) {
  const copy = labels[langCode];
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);
  const [drawMode, setDrawMode] = useState<AdeowDrawMode>("marker");

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        isNode(event.target) &&
        !toolbarRef.current.contains(event.target)
      ) {
        setOpenPanel(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      isNode(event.relatedTarget) &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setOpenPanel(null);
  };

  const selectDrawTool = (nextDrawMode: AdeowDrawMode) => {
    setDrawMode(nextDrawMode);
    onSelectTool("freedraw", { drawMode: nextDrawMode });
    setOpenPanel(null);
  };

  const renderPanel = (panelId: PanelId, children: ReactNode) => {
    if (openPanel !== panelId) {
      return null;
    }

    return (
      <div className="adeow-canvas-toolbar-menu">
        {children}
      </div>
    );
  };

  return (
    <div
      aria-label="Canvas tools"
      className="adeow-canvas-toolbar"
      data-theme={theme}
      onBlur={handleBlur}
      ref={toolbarRef}
      role="toolbar"
    >
      <div className="adeow-canvas-toolbar-group">
        <ToolbarButton
          active={activeToolType === "selection"}
          label={copy.select}
          onClick={() => onSelectTool("selection")}
        >
          <SelectIcon />
        </ToolbarButton>
        <ToolbarButton
          active={activeToolType === "hand"}
          label={copy.hand}
          onClick={() => onSelectTool("hand")}
        >
          <HandIcon />
        </ToolbarButton>
      </div>

      <div className="adeow-canvas-toolbar-group">
        <div
          className="adeow-canvas-toolbar-menu-wrap"
          data-open={openPanel === "draw" ? "true" : "false"}
          onFocus={() => setOpenPanel("draw")}
          onMouseEnter={() => setOpenPanel("draw")}
        >
          <ToolbarButton
            active={activeToolType === "freedraw" || activeToolType === "eraser"}
            label={copy.drawTools}
            onClick={() =>
              setOpenPanel((current) => (current === "draw" ? null : "draw"))
            }
          >
            {activeToolType === "eraser" ? (
              <EraserIcon />
            ) : drawMode === "highlighter" ? (
              <HighlighterIcon />
            ) : (
              <MarkerIcon />
            )}
          </ToolbarButton>
          {renderPanel(
            "draw",
            <div className="adeow-canvas-toolbar-menu-grid">
              <MenuButton label={copy.marker} onClick={() => selectDrawTool("marker")}>
                <MarkerIcon />
              </MenuButton>
              <MenuButton
                label={copy.highlighter}
                onClick={() => selectDrawTool("highlighter")}
              >
                <HighlighterIcon />
              </MenuButton>
              <MenuButton
                label={copy.eraser}
                onClick={() => {
                  onSelectTool("eraser");
                  setOpenPanel(null);
                }}
              >
                <EraserIcon />
              </MenuButton>
            </div>,
          )}
        </div>

        <ToolbarButton
          active={false}
          label={copy.sticky}
          onClick={onInsertStickyNote}
        >
          <StickyIcon />
        </ToolbarButton>

        <div
          className="adeow-canvas-toolbar-menu-wrap"
          data-open={openPanel === "shape" ? "true" : "false"}
          onFocus={() => setOpenPanel("shape")}
          onMouseEnter={() => setOpenPanel("shape")}
        >
          <ToolbarButton
            active={[
              "rectangle",
              "diamond",
              "ellipse",
              "line",
              "arrow",
            ].includes(activeToolType)}
            label={copy.shapeLine}
            onClick={() =>
              setOpenPanel((current) => (current === "shape" ? null : "shape"))
            }
          >
            <ShapeIcon />
          </ToolbarButton>
          {renderPanel(
            "shape",
            <div className="adeow-canvas-toolbar-menu-grid">
              <MenuButton
                label={copy.rectangle}
                onClick={() => {
                  onSelectTool("rectangle");
                  setOpenPanel(null);
                }}
              >
                <RectangleIcon />
              </MenuButton>
              <MenuButton
                label={copy.diamond}
                onClick={() => {
                  onSelectTool("diamond");
                  setOpenPanel(null);
                }}
              >
                <DiamondIcon />
              </MenuButton>
              <MenuButton
                label={copy.ellipse}
                onClick={() => {
                  onSelectTool("ellipse");
                  setOpenPanel(null);
                }}
              >
                <EllipseIcon />
              </MenuButton>
              <MenuButton
                label={copy.line}
                onClick={() => {
                  onSelectTool("line", { lineVariant: "line" });
                  setOpenPanel(null);
                }}
              >
                <LineIcon />
              </MenuButton>
              <MenuButton
                label={copy.arrow}
                onClick={() => {
                  onSelectTool("arrow", { lineVariant: "arrow" });
                  setOpenPanel(null);
                }}
              >
                <ArrowIcon />
              </MenuButton>
              <MenuButton
                label={copy.connector}
                onClick={() => {
                  onSelectTool("arrow", { lineVariant: "connector" });
                  setOpenPanel(null);
                }}
              >
                <ConnectorIcon />
              </MenuButton>
            </div>,
          )}
        </div>
      </div>

      <div className="adeow-canvas-toolbar-group">
        <ToolbarButton
          active={activeToolType === "text"}
          label={copy.text}
          onClick={() => onSelectTool("text")}
        >
          <TextIcon />
        </ToolbarButton>
        <ToolbarButton
          active={activeToolType === "image"}
          label={copy.image}
          onClick={() => onSelectTool("image")}
        >
          <ImageIcon />
        </ToolbarButton>
        <ToolbarButton active={false} label={copy.sheet} onClick={onInsertSheet}>
          <SheetIcon />
        </ToolbarButton>

        <div
          className="adeow-canvas-toolbar-menu-wrap"
          data-open={openPanel === "stamp" ? "true" : "false"}
          onFocus={() => setOpenPanel("stamp")}
          onMouseEnter={() => setOpenPanel("stamp")}
        >
          <ToolbarButton
            active={false}
            label={copy.stamp}
            onClick={() =>
              setOpenPanel((current) => (current === "stamp" ? null : "stamp"))
            }
          >
            <StampIcon />
          </ToolbarButton>
          {renderPanel(
            "stamp",
            <div className="adeow-canvas-stamp-grid">
              {stamps.map((stamp) => (
                <button
                  aria-label={`${copy.stamp}: ${stamp.label}`}
                  className="adeow-canvas-stamp-button"
                  key={stamp.label}
                  onClick={() => {
                    onInsertStamp(stamp.value);
                    setOpenPanel(null);
                  }}
                  type="button"
                >
                  <span className="adeow-canvas-stamp-symbol">
                    {stamp.value}
                  </span>
                  <span className="adeow-canvas-stamp-label">
                    {stamp.label}
                  </span>
                </button>
              ))}
            </div>,
          )}
        </div>

        <div
          className="adeow-canvas-toolbar-menu-wrap"
          data-open={openPanel === "codeBlock" ? "true" : "false"}
          onFocus={() => setOpenPanel("codeBlock")}
          onMouseEnter={() => setOpenPanel("codeBlock")}
        >
          <ToolbarButton
            active={false}
            label={copy.codeBlock}
            onClick={() =>
              setOpenPanel((current) =>
                current === "codeBlock" ? null : "codeBlock",
              )
            }
          >
            <CodeIcon />
          </ToolbarButton>
          {renderPanel(
            "codeBlock",
            <div className="adeow-canvas-toolbar-menu-grid">
              <MenuButton
                label={copy.addCodeBlock}
                onClick={() => {
                  onInsertCodeBlock();
                  setOpenPanel(null);
                }}
              >
                <CodeIcon />
              </MenuButton>
              <MenuButton
                label={copy.addCodeFile}
                onClick={() => {
                  onInsertCodeFile();
                  setOpenPanel(null);
                }}
              >
                <ImageIcon />
              </MenuButton>
            </div>,
          )}
        </div>

        <div
          className="adeow-canvas-toolbar-menu-wrap"
          data-open={openPanel === "more" ? "true" : "false"}
          onFocus={() => setOpenPanel("more")}
          onMouseEnter={() => setOpenPanel("more")}
        >
          <ToolbarButton
            active={["frame", "embeddable", "laser", "magicframe"].includes(
              activeToolType,
            )}
            label={copy.more}
            onClick={() =>
              setOpenPanel((current) => (current === "more" ? null : "more"))
            }
          >
            <MoreIcon />
          </ToolbarButton>
          {renderPanel(
            "more",
            <div className="adeow-canvas-toolbar-menu-grid">
              <MenuButton
                label={copy.frame}
                onClick={() => {
                  onSelectTool("frame");
                  setOpenPanel(null);
                }}
              >
                <RectangleIcon />
              </MenuButton>
              <MenuButton
                label={copy.webEmbed}
                onClick={() => {
                  onSelectTool("embeddable");
                  setOpenPanel(null);
                }}
              >
                <ImageIcon />
              </MenuButton>
              <MenuButton
                label={copy.laser}
                onClick={() => {
                  onSelectTool("laser");
                  setOpenPanel(null);
                }}
              >
                <LineIcon />
              </MenuButton>
              <MenuButton
                label={copy.mermaid}
                onClick={() => {
                  onSelectTool("magicframe");
                  setOpenPanel(null);
                }}
              >
                <CodeIcon />
              </MenuButton>
            </div>,
          )}
        </div>
      </div>
    </div>
  );
}
