import { useEffect, useRef, useState } from "react";

/** One scroll owner for the central canvas, independent of token frequency. */
export function useStreamFollow(stream: string, ready: boolean) {
  const workspaceRef = useRef<HTMLElement>(null);
  const followingRef = useRef(true);
  const [following, setFollowing] = useState(true);
  const resumeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace || !stream || !ready) return;
    let frame = 0;
    let initial = true;
    let touchY = 0;
    const scrollTop = () => mobile() ? window.scrollY : workspace.scrollTop;
    let lastTop = workspace.scrollTop;
    followingRef.current = true;
    setFollowing(true);
    const mobile = () => getComputedStyle(workspace).overflowY === "visible";
    const output = () => workspace.querySelector<HTMLElement>(".studio-output, .playground, .plan-widget");
    const pause = () => {
      followingRef.current = false;
      setFollowing(false);
    };
    const schedule = () => {
      if (frame || !followingRef.current) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const target = output();
        if (!target || !followingRef.current) return;
        const rect = target.getBoundingClientRect();
        const bounds = workspace.getBoundingClientRect();
        const top = mobile() ? 64 : bounds.top;
        const bottom = mobile() ? window.innerHeight : bounds.bottom;
        // Follow the output, never the static budget or chat below it.
        const delta = initial ? rect.top - top - 20 : Math.max(0, rect.bottom - bottom + 72);
        const options: ScrollToOptions = { top: delta, behavior: "instant" };
        if (mobile()) window.scrollBy(options);
        else workspace.scrollBy(options);
        lastTop = scrollTop();
        initial = false;
      });
    };
    const wheel = (event: WheelEvent) => { if (event.deltaY < 0) pause(); };
    const scrolled = () => {
      const next = scrollTop();
      if (next < lastTop - 2) pause();
      lastTop = next;
    };
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable=true]")) return;
      if (["ArrowUp", "PageUp", "Home"].includes(event.key) || (event.key === " " && event.shiftKey)) pause();
    };
    const touchStart = (event: TouchEvent) => { touchY = event.touches[0]?.clientY ?? 0; };
    const touchMove = (event: TouchEvent) => { if ((event.touches[0]?.clientY ?? touchY) > touchY + 8) pause(); };
    const resume = () => { followingRef.current = true; setFollowing(true); schedule(); };
    resumeRef.current = resume;
    const resize = new ResizeObserver(schedule);
    const inner = workspace.firstElementChild;
    if (inner) resize.observe(inner);
    const mutations = new MutationObserver(schedule);
    mutations.observe(workspace, { childList: true, subtree: true, characterData: true });
    workspace.addEventListener("wheel", wheel, { passive: true });
    workspace.addEventListener("keydown", key);
    workspace.addEventListener("touchstart", touchStart, { passive: true });
    workspace.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("resize", schedule);
    workspace.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("scroll", scrolled, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      workspace.removeEventListener("wheel", wheel);
      workspace.removeEventListener("keydown", key);
      workspace.removeEventListener("touchstart", touchStart);
      workspace.removeEventListener("touchmove", touchMove);
      window.removeEventListener("resize", schedule);
      workspace.removeEventListener("scroll", scrolled);
      window.removeEventListener("scroll", scrolled);
      resumeRef.current = () => {};
    };
  }, [stream, ready]);

  return { workspaceRef, following, scrollToLive: () => resumeRef.current() };
}
