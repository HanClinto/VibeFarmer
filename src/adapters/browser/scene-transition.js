export function createSceneTransition(
  element,
  {
    setTimer = setTimeout,
    nextFrame = requestAnimationFrame,
    reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches,
  } = {},
) {
  let transitionId = 0;
  const duration = (milliseconds) => (reducedMotion ? 0 : milliseconds);
  const wait = (milliseconds) => new Promise(
    (resolve) => setTimer(resolve, duration(milliseconds)),
  );

  function show(label, mode, opacityClass = "is-opaque") {
    element.hidden = false;
    element.dataset.mode = mode;
    element.querySelector("span").textContent = label;
    element.classList.remove("is-opaque", "is-dimmed");
    nextFrame(() => element.classList.add(opacityClass));
  }

  return {
    async playMapChange(label) {
      const currentId = ++transitionId;
      show(label, "map");
      await wait(180);
      if (currentId !== transitionId) return;
      element.classList.remove("is-opaque");
      await wait(260);
      if (currentId === transitionId) element.hidden = true;
    },

    async beginNight() {
      const currentId = ++transitionId;
      show("Night falls", "night");
      await wait(420);
      return currentId === transitionId;
    },

    beginWaiting() {
      transitionId += 1;
      show("Waiting for robot...", "waiting", "is-dimmed");
    },

    clearWaiting() {
      if (element.dataset.mode !== "waiting") return;
      transitionId += 1;
      element.classList.remove("is-opaque", "is-dimmed");
      element.hidden = true;
    },

    async wake() {
      const currentId = ++transitionId;
      element.hidden = false;
      element.dataset.mode = "morning";
      element.querySelector("span").textContent = "Good morning";
      element.classList.remove("is-opaque", "is-dimmed");
      await wait(500);
      if (currentId === transitionId) element.hidden = true;
    },
  };
}