/**
 * Pointer gesture state for the room canvas: dragging pans the camera, a
 * press that barely moves is a click. Interactive objects read `dragged` so a
 * pan that ends over an object does not activate it.
 */
export const pointerGesture = {
  down: false,
  dragged: false,
  startX: 0,
  lastX: 0,
  /** Accumulated horizontal pan in pixels since the gesture began. */
  pan: 0,
};

const DRAG_THRESHOLD = 6;

export function attachGesture(el: HTMLElement) {
  const onDown = (e: PointerEvent) => {
    pointerGesture.down = true;
    pointerGesture.dragged = false;
    pointerGesture.startX = pointerGesture.lastX = e.clientX;
  };
  const onMove = (e: PointerEvent) => {
    if (!pointerGesture.down) return;
    if (Math.abs(e.clientX - pointerGesture.startX) > DRAG_THRESHOLD) pointerGesture.dragged = true;
    if (pointerGesture.dragged) pointerGesture.pan += e.clientX - pointerGesture.lastX;
    pointerGesture.lastX = e.clientX;
  };
  const onUp = () => {
    pointerGesture.down = false;
    // Keep `dragged` until after the click event that follows pointerup.
    setTimeout(() => (pointerGesture.dragged = false), 0);
  };
  el.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  return () => {
    el.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
  };
}
