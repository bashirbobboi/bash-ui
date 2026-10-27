"use client";

import { AccountMenu } from "./account-menu.tsx";
import { items, signOut, user } from "./fixtures.ts";

export default function AccountMenuPreview() {
  return (
    // The trigger fills its row, so give it the width of a rail.
    <div className="w-64 max-w-full">
      <AccountMenu user={user} items={items} onSignOut={signOut} />
    </div>
  );
}
