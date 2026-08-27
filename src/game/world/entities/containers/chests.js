export function createChest({ id, position, capacity = 20, inventory = [] }) {
  const slots = Array.from({ length: capacity }, (_, index) => inventory[index] ?? null);
  return {
    id,
    type: "chest",
    position: { ...position },
    inventory: slots,
  };
}