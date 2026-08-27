import assert from "node:assert/strict";
import test from "node:test";

import {
  applyMoneyCheat,
  moneyCheatFromSearch,
} from "../src/adapters/browser/development-cheats.js";

test("money cheat accepts a nonnegative integer and ignores other parameters", () => {
  assert.equal(moneyCheatFromSearch("?market=1&cheatMoney=2500"), 2500);
  assert.equal(moneyCheatFromSearch("?cheatMoney=0"), 0);
});

test("money cheat rejects malformed values and caps excessive amounts", () => {
  assert.equal(moneyCheatFromSearch("?cheatMoney=-1"), null);
  assert.equal(moneyCheatFromSearch("?cheatMoney=12.5"), null);
  assert.equal(moneyCheatFromSearch("?cheatMoney=lots"), null);
  assert.equal(moneyCheatFromSearch("?cheatMoney=999999999"), 1_000_000);
});

test("applying the money cheat changes only shared money", () => {
  const state = { money: 100, day: 3 };

  assert.equal(applyMoneyCheat(state, "?cheatMoney=4200"), 4200);
  assert.deepEqual(state, { money: 4200, day: 3 });
});