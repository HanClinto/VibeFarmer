export function createSleepWaitFlow({
  delay = 2500,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  shouldContinue,
  onWaiting,
  onPrompt,
  onClear,
}) {
  let timer = null;
  let waiting = false;

  function clear() {
    if (timer !== null) clearTimer(timer);
    timer = null;
    if (!waiting) return;
    waiting = false;
    onClear();
  }

  return {
    begin() {
      clear();
      waiting = true;
      onWaiting();
      timer = setTimer(() => {
        timer = null;
        if (!shouldContinue()) {
          clear();
          return;
        }
        onPrompt();
      }, delay);
    },

    sync() {
      if (waiting && !shouldContinue()) clear();
    },

    clear,
  };
}