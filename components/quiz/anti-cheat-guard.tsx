"use client";

import { useState, useEffect } from "react";
import AntiCheatOverlay from "./anti-cheat-overlay";

interface AntiCheatGuardProps {
  children: React.ReactNode;
  onViolationLimitReached?: () => void;
}

export default function AntiCheatGuard({ 
  children, 
  onViolationLimitReached 
}: AntiCheatGuardProps) {
  const [isCheatOverlayVisible, setIsCheatOverlayVisible] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const MAX_VIOLATIONS = 3;

  useEffect(() => {
    if (isLocked) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+P, Ctrl+U, Ctrl+S
      const isBlocked = 
        ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a", "p", "u", "s"].includes(e.key.toLowerCase())) ||
        e.key === "F12" || e.key === "PrintScreen";
      
      if (isBlocked) {
        e.preventDefault();
        triggerViolation();
      }
    };

    const triggerViolation = () => {
      setViolationCount(prev => {
        const next = prev + 1;
        if (next >= MAX_VIOLATIONS) {
          setIsLocked(true);
          onViolationLimitReached?.();
        }
        return next;
      });
      setIsCheatOverlayVisible(true);
    };

    const showOverlay = () => {
      if (!isCheatOverlayVisible) {
        triggerViolation();
      }
    };

    const hideOverlay = () => {
      if (!isLocked) {
        // Small delay to ensure overlay was captured if it was a screenshot attempt
        setTimeout(() => setIsCheatOverlayVisible(false), 300);
      }
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
  }, [isLocked, isCheatOverlayVisible]);

  return (
    <div className="no-select relative min-h-screen">
      <AntiCheatOverlay 
        isVisible={isCheatOverlayVisible || isLocked} 
        violationCount={violationCount}
        isLocked={isLocked}
        maxViolations={MAX_VIOLATIONS}
      />
      <div className={isLocked ? "blur-xl pointer-events-none select-none" : ""}>
        {children}
      </div>
    </div>
  );
}
