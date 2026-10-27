import type { ContributionDay } from "./contribution-calendar";
/** Deterministic preview data. Supply actual contributions in the consuming project. */
export const contributions: ContributionDay[] = Array.from({length:365},(_,index) => {
  const count = index % 7 === 0 || index % 11 === 0 ? 0 : (index * 17 + 3) % 15;
  return {date:new Date(Date.UTC(2025,0,1+index)).toISOString().slice(0,10),count,level:(count === 0 ? 0 : count < 4 ? 1 : count < 8 ? 2 : count < 12 ? 3 : 4) as ContributionDay["level"]};
});
