const EVENT_CUES = Object.freeze({
  crop_harvested: "harvest",
  item_bought: "coin",
  item_sold: "coin",
  item_transferred: "transfer",
  portal_travel: "portal",
  robot_recharged: "recharge",
  day_begin: "morning",
});

export function audioCueForEvent(event) {
  if (event.type === "use_item") {
    if (event.itemId === "watering_can") return "water";
    if (event.itemId === "axe") return "chop";
    if (event.itemId === "hoe") return "soil";
    return "plant";
  }
  return EVENT_CUES[event.type] ?? null;
}

const CUES = Object.freeze({
  harvest: [[660, 0], [880, 0.08], [1040, 0.16]],
  coin: [[880, 0], [1320, 0.07]],
  transfer: [[440, 0], [550, 0.08]],
  portal: [[330, 0], [495, 0.08], [740, 0.16]],
  morning: [[523, 0], [659, 0.1], [784, 0.2]],
  water: [[360, 0], [420, 0.06]],
  chop: [[180, 0]],
  soil: [[240, 0]],
  plant: [[500, 0], [620, 0.06]],
  recharge: [[330, 0], [440, 0.07], [660, 0.14]],
});

export function createGameAudio({
  contextFactory = () => new AudioContext(),
} = {}) {
  let enabled = false;
  let context = null;

  function ensureContext() {
    context ??= contextFactory();
    if (context.state === "suspended") context.resume();
    return context;
  }

  function playCue(cueName) {
    if (!enabled || !CUES[cueName]) return false;
    const audioContext = ensureContext();
    const start = audioContext.currentTime;
    for (const [frequency, offset] of CUES[cueName]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = cueName === "chop" || cueName === "soil" ? "square" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.07, start + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.13);
    }
    return true;
  }

  return {
    setEnabled(nextEnabled) {
      enabled = Boolean(nextEnabled);
      if (enabled) ensureContext();
      return enabled;
    },
    playEvent(event) {
      const cue = audioCueForEvent(event);
      return cue ? playCue(cue) : false;
    },
    isEnabled: () => enabled,
  };
}