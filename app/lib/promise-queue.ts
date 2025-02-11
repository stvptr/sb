export const createQueue = () => {
  const queue: (() => Promise<void>)[] = [];
  let isProcessing = false;

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) {
      return;
    }

    isProcessing = true;

    const task = queue.shift();
    if (task) await task().catch(console.error);

    isProcessing = false;
    processQueue();
  };

  return {
    add: (task: () => Promise<void>) => {
      queue.push(task);
      processQueue();
    },
    isEmpty: () => queue.length === 0,
  };
};
