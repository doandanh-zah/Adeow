"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type CanvasAuthUser = Pick<User, "email" | "user_metadata"> | null;

type CanvasTopRightControlsProps = {
  initialUser: CanvasAuthUser;
  isLibraryOpen: boolean;
  langCode: "en" | "vi-VN";
  onToggleLibrary: () => void;
};

const copy = {
  en: {
    library: "Library",
    signIn: "Sign in with Google",
    signInShort: "Sign in",
    signInCompact: "Google",
    signOut: "Sign out",
    switchAccount: "Switch account",
    account: "Account",
    checking: "Opening Google",
  },
  "vi-VN": {
    library: "Thư viện",
    signIn: "Đăng nhập Google",
    signInShort: "Đăng nhập",
    signInCompact: "Google",
    signOut: "Đăng xuất",
    switchAccount: "Đổi tài khoản",
    account: "Tài khoản",
    checking: "Đang mở Google",
  },
} as const;

const GridIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="M3.5 3.5h3v3h-3zm6 0h3v3h-3zm-6 6h3v3h-3zm6 0h3v3h-3z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      d="m4 6 4 4 4-4"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    />
  </svg>
);

const GoogleBadge = () => (
  <svg
    aria-hidden="true"
    className="adeow-google-badge"
    viewBox="0 0 18 18"
  >
    <path
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.56 2.68-3.86 2.68-6.62Z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.34A8.99 8.99 0 0 0 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.19.28-1.72V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3-2.34Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.32 0 2.5.46 3.44 1.37l2.58-2.58C13.46.92 11.42 0 9 0A8.99 8.99 0 0 0 .96 4.94l3 2.34c.7-2.12 2.7-3.7 5.04-3.7Z"
      fill="#EA4335"
    />
  </svg>
);

function getUserLabel(user: CanvasAuthUser, fallback: string) {
  if (!user) {
    return fallback;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return fallback;
}

function getUserInitial(user: CanvasAuthUser, fallback: string) {
  return getUserLabel(user, fallback).trim().charAt(0).toUpperCase() || "A";
}

function getUserAvatarUrl(user: CanvasAuthUser) {
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return avatarUrl || null;
}

function getOAuthRedirectBase() {
  const url = new URL(window.location.href);
  if (
    url.hostname === "0.0.0.0" ||
    url.hostname === "::" ||
    url.hostname === "[::]" ||
    url.hostname === "::1"
  ) {
    url.hostname = "localhost";
  }

  return `${url.protocol}//${url.host}`;
}

export function CanvasTopRightControls({
  initialUser,
  isLibraryOpen,
  langCode,
  onToggleLibrary,
}: CanvasTopRightControlsProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const labels = copy[langCode];
  const accountRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<CanvasAuthUser>(initialUser);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAccountOpen(false);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignIn = async (forceAccountChooser = true) => {
    setIsAuthBusy(true);

    const redirectTo = new URL("/auth/callback", getOAuthRedirectBase());
    redirectTo.searchParams.set(
      "next",
      `${window.location.pathname}${window.location.search}`,
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
        queryParams: forceAccountChooser
          ? {
              prompt: "select_account",
            }
          : undefined,
      },
    });

    if (error) {
      setIsAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthBusy(true);

    await supabase.auth.signOut();
    setUser(null);
    setIsAccountOpen(false);
    setIsAuthBusy(false);
  };

  const handleLibraryClick = () => {
    onToggleLibrary();
  };

  const avatarUrl = getUserAvatarUrl(user);
  const openAccountMenu = () => {
    if (!user) {
      void handleSignIn(true);
      return;
    }

    setIsAccountOpen((current) => !current);
  };

  return (
    <div className="adeow-top-right-controls">
      <div className="adeow-top-right-dock">
        {user ? (
          <div className="adeow-control-anchor" ref={accountRef}>
            <button
              aria-expanded={isAccountOpen}
              aria-haspopup="menu"
              aria-label={labels.account}
              className="adeow-dock-avatar-button"
              data-active={isAccountOpen}
              onClick={openAccountMenu}
              type="button"
            >
              {avatarUrl ? (
                <Image
                  alt=""
                  aria-hidden="true"
                  className="adeow-avatar-image"
                  height={32}
                  src={avatarUrl}
                  unoptimized
                  width={32}
                />
              ) : (
                <span aria-hidden="true" className="adeow-avatar-badge">
                  {getUserInitial(user, labels.account)}
                </span>
              )}
              <ChevronDownIcon />
            </button>
            {isAccountOpen && (
              <div
                className="adeow-top-right-popover adeow-top-right-popover--dock dropdown-menu"
                role="menu"
              >
                <div className="dropdown-menu-container">
                  {user.email && (
                    <div className="adeow-top-right-meta">{user.email}</div>
                  )}
                  <button
                    className="dropdown-menu-item dropdown-menu-item-base adeow-top-right-menu-item"
                    disabled={isAuthBusy}
                    onClick={() => handleSignIn(true)}
                    type="button"
                  >
                    <span className="dropdown-menu-item__text">
                      {labels.switchAccount}
                    </span>
                  </button>
                  <button
                    className="dropdown-menu-item dropdown-menu-item-base adeow-top-right-menu-item"
                    onClick={handleSignOut}
                    type="button"
                  >
                    <span className="dropdown-menu-item__text">
                      {labels.signOut}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="adeow-dock-primary-button"
            disabled={isAuthBusy}
            onClick={() => {
              void handleSignIn(true);
            }}
            type="button"
          >
            <GoogleBadge />
            <span>{isAuthBusy ? labels.checking : labels.signIn}</span>
          </button>
        )}

        <button
          aria-label={labels.library}
          aria-pressed={isLibraryOpen}
          className="adeow-dock-icon-button"
          data-active={isLibraryOpen}
          onClick={handleLibraryClick}
          type="button"
        >
          <GridIcon />
        </button>
      </div>
    </div>
  );
}
