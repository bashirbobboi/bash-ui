"use client";

import { SearchBar } from "./search-bar.tsx";
import { categories } from "./fixtures.ts";

export default function SearchBarPreview() {
  return (
    <div className="w-full max-w-[440px]">
      <SearchBar categories={categories} />
    </div>
  );
}
