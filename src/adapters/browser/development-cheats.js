const MAX_CHEAT_MONEY = 1_000_000;

export function moneyCheatFromSearch(search) {
  const value = new URLSearchParams(search).get("cheatMoney");
  if (value === null || !/^\d+$/.test(value)) return null;
  const money = Number(value);
  if (!Number.isSafeInteger(money)) return null;
  return Math.min(money, MAX_CHEAT_MONEY);
}

export function applyMoneyCheat(state, search) {
  const money = moneyCheatFromSearch(search);
  if (money === null) return null;
  state.money = money;
  return money;
}