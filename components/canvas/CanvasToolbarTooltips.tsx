"use client";

import { useEffect } from "react";
import type { CanvasLanguageCode } from "@/lib/canvas-core/ui";

type CanvasToolbarTooltipsProps = {
  langCode: CanvasLanguageCode;
};

const CANVAS_HOST_SELECTOR = ".adeow-canvas-host";
const TOOLBAR_SELECTOR = `${CANVAS_HOST_SELECTOR} .excalidraw .App-toolbar-container`;

function normalizeTooltipLabel(value: string | null | undefined) {
  return value?.split("—")[0]?.trim() ?? "";
}

function setTooltipLabel(element: HTMLElement, label: string) {
  if (label) {
    element.dataset.adeowToolLabel = label;
    return;
  }

  delete element.dataset.adeowToolLabel;
}

function updateToolbarTooltipLabels() {
  document.querySelectorAll<HTMLElement>(TOOLBAR_SELECTOR).forEach((toolbar) => {
    toolbar.querySelectorAll<HTMLElement>(".ToolIcon").forEach((tool) => {
      const inputLabel = tool
        .querySelector<HTMLInputElement>("input[aria-label]")
        ?.getAttribute("aria-label");

      setTooltipLabel(
        tool,
        normalizeTooltipLabel(inputLabel ?? tool.getAttribute("title")),
      );
    });

    toolbar
      .querySelectorAll<HTMLElement>(
        ".ToolIcon_type_button, .App-toolbar__extra-tools-trigger",
      )
      .forEach((tool) => {
        setTooltipLabel(
          tool,
          normalizeTooltipLabel(
            tool.getAttribute("aria-label") ?? tool.getAttribute("title"),
          ),
        );
      });
  });
}

export function CanvasToolbarTooltips({
  langCode,
}: CanvasToolbarTooltipsProps) {
  useEffect(() => {
    const host = document.querySelector(CANVAS_HOST_SELECTOR);
    let animationFrameId: number | null = null;

    const scheduleUpdate = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateToolbarTooltipLabels();
      });
    };

    updateToolbarTooltipLabels();

    if (!host) {
      return () => {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId);
        }
      };
    }

    const observer = new MutationObserver(scheduleUpdate);

    observer.observe(host, {
      attributeFilter: ["aria-label", "class", "title"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [langCode]);

  return null;
}
