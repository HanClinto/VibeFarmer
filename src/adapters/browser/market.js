export function marketListings(itemTypes) {
  const items = Object.values(itemTypes);
  return {
    buy: items.filter((item) => item.buyPrice).sort(
      (first, second) => first.buyPrice - second.buyPrice || first.name.localeCompare(second.name),
    ),
    sell: items.filter((item) => item.sellPrice).sort(
      (first, second) => first.sellPrice - second.sellPrice || first.name.localeCompare(second.name),
    ),
  };
}