export const dev = (cb: () => void) => {
  if (import.meta.env.DEV) {
    cb();
  }
};

export const printDev = (...args: Parameters<typeof console.log>) => {
  dev(() => {
    console.log(...args);
  });
};
