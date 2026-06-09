"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CanvasAuthUser } from "@/components/canvas/CanvasTopRightControls";
import {
  listLocalCanvasDirectoryEntries,
  upsertLocalCanvasDirectoryEntry,
} from "@/lib/canvas-core/document";
import type { CanvasLanguageCode, CanvasTheme } from "@/lib/canvas-core/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import {
  buildUniqueCanvasRouteId,
  createCanvasForUser,
  getCanvasTitle,
  listCanvasesForUser,
  normalizeRouteCanvasId,
} from "@/lib/supabase/canvases";

type CanvasPageSwitcherProps = {
  canvasId: string;
  initialUser: CanvasAuthUser;
  langCode: CanvasLanguageCode;
  theme: CanvasTheme;
};

type PageEntry = {
  routeId: string;
  title: string;
  updatedAt: string;
};

const HOME_ROUTE_ID = "home";

const copy: Record<
  CanvasLanguageCode,
  {
    create: string;
    createBusy: string;
    createError: string;
    loading: string;
    loadError: string;
    menu: string;
  }
> = {
  en: {
    create: "Create new page",
    createBusy: "Creating page...",
    createError: "Could not create a new page.",
    loading: "Loading pages...",
    loadError: "Could not load pages.",
    menu: "Open page menu",
  },
  "vi-VN": {
    create: "Tạo trang mới",
    createBusy: "Đang tạo trang...",
    createError: "Không tạo được trang mới.",
    loading: "Đang tải danh sách trang...",
    loadError: "Không tải được danh sách trang.",
    menu: "Mở menu trang",
  },
};

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M8 3.5v9m4.5-4.5h-9"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

function getPageLabel(routeId: string, title?: string) {
  if (normalizeRouteCanvasId(routeId) === HOME_ROUTE_ID) {
    return "Page 1";
  }

  if (title?.trim()) {
    return title.trim();
  }

  return getCanvasTitle(routeId);
}

function orderEntries(entries: PageEntry[], currentRouteId: string) {
  return [...entries].sort((left, right) => {
    if (left.routeId === currentRouteId) {
      return -1;
    }

    if (right.routeId === currentRouteId) {
      return 1;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function ensureCurrentEntry(entries: PageEntry[], currentRouteId: string) {
  const normalizedRouteId = normalizeRouteCanvasId(currentRouteId);

  if (entries.some((entry) => entry.routeId === normalizedRouteId)) {
    return orderEntries(entries, normalizedRouteId);
  }

  return orderEntries(
    [
      {
        routeId: normalizedRouteId,
        title: getPageLabel(normalizedRouteId),
        updatedAt: new Date().toISOString(),
      },
      ...entries,
    ],
    normalizedRouteId,
  );
}

function readLocalEntries(currentRouteId: string) {
  const localEntries = listLocalCanvasDirectoryEntries().map((entry) => ({
    routeId: entry.id,
    title: getPageLabel(entry.id, entry.title),
    updatedAt: entry.updatedAt,
  }));

  return ensureCurrentEntry(localEntries, currentRouteId);
}

function buildNextPageTitle(entries: PageEntry[]) {
  const takenTitles = new Set(
    entries.map((entry) => getPageLabel(entry.routeId, entry.title).toLowerCase()),
  );

  let number = 1;

  while (takenTitles.has(`page ${number}`)) {
    number += 1;
  }

  return `Page ${number}`;
}

export function CanvasPageSwitcher({
  canvasId,
  initialUser,
  langCode,
  theme,
}: CanvasPageSwitcherProps) {
  const labels = copy[langCode];
  const isSupabaseEnabled = useMemo(() => hasSupabasePublicEnv(), []);
  const supabase = useMemo(
    () => (isSupabaseEnabled ? createSupabaseBrowserClient() : null),
    [isSupabaseEnabled],
  );
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(initialUser && supabase));
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [entries, setEntries] = useState<PageEntry[]>(() =>
    readLocalEntries(canvasId),
  );

  useEffect(() => {
    let isMounted = true;

    const syncEntries = async () => {
      if (!supabase || !initialUser) {
        setEntries(readLocalEntries(canvasId));
        setIsLoading(false);
        setErrorMessage(null);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setEntries(readLocalEntries(canvasId));
          setIsLoading(false);
          return;
        }

        const cloudEntries = await listCanvasesForUser(supabase, user.id);

        if (!isMounted) {
          return;
        }

        setEntries(
          ensureCurrentEntry(
            cloudEntries.map((entry) => ({
              routeId: entry.routeId,
              title: getPageLabel(entry.routeId, entry.title),
              updatedAt: entry.updatedAt,
            })),
            canvasId,
          ),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setEntries(readLocalEntries(canvasId));
        setErrorMessage(labels.loadError);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void syncEntries();

    return () => {
      isMounted = false;
    };
  }, [canvasId, initialUser, labels.loadError, supabase]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentLabel = getPageLabel(
    canvasId,
    entries.find((entry) => entry.routeId === canvasId)?.title,
  );

  const navigateToPage = (routeId: string) => {
    setIsOpen(false);
    router.push(`/canvas/${routeId}`);
  };

  const handleCreatePage = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    const requestedTitle = buildNextPageTitle(entries);

    try {
      if (supabase && initialUser) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const createdPage = await createCanvasForUser(
            supabase,
            user.id,
            requestedTitle,
          );

          setEntries((currentEntries) =>
            ensureCurrentEntry(
              [
                {
                  routeId: createdPage.routeId,
                  title: getPageLabel(createdPage.routeId, createdPage.title),
                  updatedAt: new Date().toISOString(),
                },
                ...currentEntries.filter(
                  (entry) => entry.routeId !== createdPage.routeId,
                ),
              ],
              canvasId,
            ),
          );
          navigateToPage(createdPage.routeId);
          return;
        }
      }

      const routeId = buildUniqueCanvasRouteId(
        entries.map((entry) => entry.routeId),
        requestedTitle,
      );
      const newEntry = {
        routeId,
        title: requestedTitle,
        updatedAt: new Date().toISOString(),
      };

      upsertLocalCanvasDirectoryEntry({
        id: routeId,
        title: newEntry.title,
        updatedAt: newEntry.updatedAt,
      });
      setEntries((currentEntries) =>
        ensureCurrentEntry(
          [
            newEntry,
            ...currentEntries.filter((entry) => entry.routeId !== routeId),
          ],
          canvasId,
        ),
      );
      navigateToPage(routeId);
    } catch {
      setErrorMessage(labels.createError);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div
      className="adeow-page-switcher"
      data-theme={theme}
      ref={containerRef}
    >
      <div className="adeow-page-switcher-row">
        <div className="adeow-page-switcher-anchor">
          <button
            aria-label={labels.menu}
            aria-controls="adeow-page-switcher-menu"
            aria-expanded={isOpen}
            className="adeow-page-switcher-trigger"
            data-active={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <span className="adeow-page-switcher-trigger-label">
              {currentLabel}
            </span>
          </button>

          {isOpen ? (
            <div
              className="adeow-page-switcher-popover"
              id="adeow-page-switcher-menu"
            >
              {isLoading ? (
                <div className="adeow-page-switcher-status">
                  {labels.loading}
                </div>
              ) : (
                <div className="adeow-page-switcher-list">
                  {entries.map((entry) => {
                    const isCurrent = entry.routeId === canvasId;

                    return (
                      <button
                        aria-current={isCurrent ? "page" : undefined}
                        className="adeow-page-switcher-menu-item"
                        data-active={isCurrent}
                        key={entry.routeId}
                        onClick={() => {
                          if (!isCurrent) {
                            navigateToPage(entry.routeId);
                          }
                        }}
                        type="button"
                      >
                        <span className="adeow-page-switcher-item-label">
                          {getPageLabel(entry.routeId, entry.title)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="adeow-page-switcher-footer">
                <button
                  className="adeow-page-switcher-create"
                  disabled={isCreating || isLoading}
                  onClick={() => {
                    void handleCreatePage();
                  }}
                  type="button"
                >
                  <span>{isCreating ? labels.createBusy : labels.create}</span>
                  <PlusIcon />
                </button>
              </div>

              {errorMessage ? (
                <p className="adeow-page-switcher-error">{errorMessage}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
