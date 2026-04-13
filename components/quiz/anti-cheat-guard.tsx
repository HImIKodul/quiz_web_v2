"use client";

import { useState, useEffect } from "react";
import AntiCheatOverlay from "./anti-cheat-overlay";

interface AntiCheatGuardProps {
  children: React.ReactNode;
}

export default function AntiCheatGuard({ children }: AntiCheatGuardProps) {
  const [isCheatOverlayVisible, setIsCheatOverlayVisible] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+P, Ctrl+U, Ctrl+S
      const isBlocked = 
        ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a", "p", "u", "s"].includes(e.key.toLowerCase())) ||
        e.key === "F12";
      
      if (isBlocked) {
        e.preventDefault();
      }
    };

    const showOverlay = () => setIsCheatOverlayVisible(true);
    const hideOverlay = () => {
      // Small delay to ensure overlay was captured if it was a screenshot attempt
      setTimeout(() => setIsCheatOverlayVisible(false), 300);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        showOverlay();
      } else {
        hideOverlay();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", showOverlay);
    window.addEventListener("focus", hideOverlay);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", showOverlay);
      window.removeEventListener("focus", hideOverlay);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="no-select">
      <AntiCheatOverlay isVisible={isCheatOverlayVisible} />
      {children}
    </div>
  );
}
