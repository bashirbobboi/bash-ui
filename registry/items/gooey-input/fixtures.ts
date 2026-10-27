/** Stand-in for a sign-up request: long enough to see the droplet spin, then tick. */
export const subscribe = () => new Promise<void>((resolve) => setTimeout(resolve, 900));
