/** Complete each two-column run without reordering components. */
export function tileSpans(fullWidth: readonly boolean[]): (1 | 2)[] {
  const spans: (1 | 2)[] = fullWidth.map((full) => full ? 2 : 1);
  let unpaired: number | null = null;
  for (let index = 0; index < spans.length; index++) {
    if (spans[index] === 2) {
      if (unpaired !== null) spans[unpaired] = 2;
      unpaired = null;
    } else {
      unpaired = unpaired === null ? index : null;
    }
  }
  if (unpaired !== null) spans[unpaired] = 2;
  return spans;
}

export type TileSize = { height: number; fullWidth: boolean };
export type TilePlacement = { top: number; height: number; column: 1 | 2; span: 1 | 2 };

/** Balance adjacent stacks, keeping source order and full-width boundaries. */
export function balanceTiles(tiles: readonly TileSize[], gap = 12, plan?: readonly TilePlacement[]): TilePlacement[] {
  const stablePlan = plan?.length === tiles.length ? plan : undefined;
  const placements: TilePlacement[] = [];
  let top = 0;
  let start = 0;

  while (start < tiles.length) {
    if (tiles[start].fullWidth) {
      const height = Math.ceil(tiles[start].height);
      placements.push({ top, height, column: 1, span: 2 });
      top += height + gap;
      start++;
      continue;
    }

    let end = start;
    while (end < tiles.length && !tiles[end].fullWidth) end++;
    const heights = tiles.slice(start, end).map((tile) => Math.ceil(tile.height));
    const costs = Array<number>(heights.length + 1).fill(Infinity);
    const choices = Array<{ left: number; right: number }>(heights.length);
    const stackHeight = (from: number, count: number) =>
      heights.slice(from, from + count).reduce((sum, height) => sum + height, 0) + gap * (count - 1);
    costs[heights.length] = 0;

    // Try short neighbouring stacks. Prefer ordinary pairs when equally good.
    for (let index = heights.length - 1; index >= 0; index--) {
      if (index === heights.length - 1) {
        costs[index] = heights[index];
        choices[index] = { left: 1, right: 0 };
      }
      for (let left = 1; left <= 3; left++) {
        for (let right = 1; right <= 3 && index + left + right <= heights.length; right++) {
          const waste = Math.abs(stackHeight(index, left) - stackHeight(index + left, right));
          const cost = waste + costs[index + left + right];
          if (cost < costs[index]) {
            costs[index] = cost;
            choices[index] = { left, right };
          }
        }
      }
    }

    for (let index = 0; index < heights.length;) {
      let { left, right } = choices[index];
      if (stablePlan) {
        // Keep the chosen stacks while an inline preview opens or closes.
        // Their heights can grow without moving a control to another column.
        left = 0;
        while (index + left < heights.length && stablePlan[start + index + left].column === 1) left++;
        right = 0;
        while (index + left + right < heights.length && stablePlan[start + index + left + right].column === 2) right++;
      }
      const height = Math.max(stackHeight(index, left), right ? stackHeight(index + left, right) : 0);
      const placeStack = (from: number, count: number, column: 1 | 2) => {
        let cursor = top;
        const spare = height - stackHeight(from, count);
        for (let offset = 0; offset < count; offset++) {
          // Divide spare space evenly; rounding still leaves both bottoms exact.
          const extra = Math.round(spare * (offset + 1) / count) - Math.round(spare * offset / count);
          const tileHeight = heights[from + offset] + extra;
          placements.push({ top: cursor, height: tileHeight, column, span: right ? 1 : 2 });
          cursor += tileHeight + gap;
        }
      };
      placeStack(index, left, 1);
      if (right) placeStack(index + left, right, 2);
      top += height + gap;
      index += left + right;
    }
    start = end;
  }
  return placements;
}
