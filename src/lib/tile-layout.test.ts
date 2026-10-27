import assert from "node:assert/strict";
import test from "node:test";
import { balanceTiles, tileSpans, type TileSize } from "./tile-layout.ts";

test("odd collections finish with a full row; even collections stay paired", () => {
  assert.deepEqual(tileSpans([]), []);
  assert.deepEqual(tileSpans([false]), [2]);
  assert.deepEqual(tileSpans([false, false]), [1, 1]);
  assert.deepEqual(tileSpans(Array(5).fill(false)), [1, 1, 1, 1, 2]);
});
test("full-width charts leave no gaps before or after them", () => {
  assert.deepEqual(tileSpans([false, true, false, false, false]), [2, 2, 1, 1, 2]);
  assert.deepEqual(tileSpans([true, true, false, false]), [2, 2, 1, 1]);
});
test("every row is complete as collections grow and charts are added", () => {
  for (let length = 0; length <= 9; length++) {
    for (let mask = 0; mask < 2 ** length; mask++) {
      const full = Array.from({ length }, (_, index) => Boolean(mask & (1 << index)));
      let used = 0;
      tileSpans(full).forEach((span, index) => {
        if (full[index]) assert.equal(span, 2);
        used += span;
        assert.ok(used <= 2);
        if (used === 2) used = 0;
      });
      assert.equal(used, 0);
    }
  }
});

const size = (height: number, fullWidth = false): TileSize => ({ height, fullWidth });

test("three small previews balance one tall preview in either column", () => {
  assert.deepEqual(balanceTiles([size(456), size(144), size(144), size(144)]), [
    { top: 0, height: 456, column: 1, span: 1 },
    { top: 0, height: 144, column: 2, span: 1 },
    { top: 156, height: 144, column: 2, span: 1 },
    { top: 312, height: 144, column: 2, span: 1 },
  ]);
  assert.deepEqual(balanceTiles([size(144), size(144), size(144), size(456)]).map(({ column, top }) => [column, top]), [
    [1, 0], [1, 156], [1, 312], [2, 0],
  ]);
});

test("a preview's tile height depends on its neighbours in the current gallery", () => {
  const besideCard = balanceTiles([size(500), size(144), size(144), size(144)]);
  const amongButtons = balanceTiles([size(144), size(144), size(144), size(144)]);
  assert.equal(besideCard[1].height, 159);
  assert.equal(amongButtons[1].height, 144);
  assert.equal(besideCard[3].top + besideCard[3].height, 500);
});

test("equal previews stay paired and a lone preview fills the width", () => {
  assert.deepEqual(balanceTiles([]), []);
  assert.deepEqual(balanceTiles([size(144)]), [{ top: 0, height: 144, column: 1, span: 2 }]);
  assert.deepEqual(balanceTiles([size(144), size(144), size(144)]), [
    { top: 0, height: 144, column: 1, span: 1 },
    { top: 0, height: 144, column: 2, span: 1 },
    { top: 156, height: 144, column: 1, span: 2 },
  ]);
});

test("inline expansion preserves columns while moving following tiles down", () => {
  const resting = [size(456), size(144), size(144), size(144), size(280, true)];
  const plan = balanceTiles(resting);
  const opened = balanceTiles([size(456), size(360), size(144), size(144), size(280, true)], 12, plan);
  assert.deepEqual(opened.map(({ column, span }) => [column, span]), plan.map(({ column, span }) => [column, span]));
  assert.equal(opened[1].height, 360);
  assert.equal(opened[2].top, opened[1].top + opened[1].height + 12);
  assert.equal(opened[3].top, opened[2].top + opened[2].height + 12);
  assert.equal(opened[4].top, opened[3].top + opened[3].height + 12);
  assert.equal(opened[0].height, opened[3].top + opened[3].height);
  assert.deepEqual(balanceTiles(resting, 12, plan), plan);
});

test("full-width previews separate runs and use their own measured height", () => {
  const tiles = balanceTiles([size(144), size(280, true), size(456), size(144), size(144), size(144)]);
  assert.deepEqual(tiles[0], { top: 0, height: 144, column: 1, span: 2 });
  assert.deepEqual(tiles[1], { top: 156, height: 280, column: 1, span: 2 });
  assert.equal(tiles[2].top, 448);
  assert.equal(tiles.at(-1)!.top + tiles.at(-1)!.height, 904);
});

test("varied collections have complete columns, gutters, and enough space for every preview", () => {
  for (let length = 1; length <= 9; length++) {
    for (let mask = 0; mask < 2 ** length; mask++) {
      const input = Array.from({ length }, (_, index) => size(
        144 + ((index * 137 + mask * 53) % 400), Boolean(mask & (1 << index)),
      ));
      const tiles = balanceTiles(input);
      assert.equal(tiles.length, input.length);
      tiles.forEach((tile, index) => {
        assert.ok(tile.height >= input[index].height);
        if (input[index].fullWidth) assert.equal(tile.span, 2);
      });
      const bottoms = [1, 2].map((column) => {
        const stack = tiles.filter((tile) => tile.column === column || tile.span === 2);
        let bottom = -12;
        for (const tile of stack) {
          assert.equal(tile.top, bottom + 12);
          bottom = tile.top + tile.height;
        }
        return bottom;
      });
      assert.equal(bottoms[0], bottoms[1]);
    }
  }
});
