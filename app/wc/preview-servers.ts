export const createPreviewServers = () => {
  let serversListeners: (() => void)[] = [];
  const subServers = (listener: () => void) => {
    serversListeners.push(listener);
    return () => {
      serversListeners = serversListeners.filter((l) => l !== listener);
    };
  };

  const emitChangeServers = () => {
    for (let listener of serversListeners) {
      listener();
    }
  };

  let servers: string[] = [];

  const rm = (url: string) => {
    servers = servers.filter((s) => s !== url);
    emitChangeServers();
  };

  const add = (url: string) => {
    servers = [...new Set([...servers, url])];
    emitChangeServers();
  };

  const clear = () => {
    servers = [];
    emitChangeServers();
  };

  return {
    subServers,
    getServers: () => servers,
    add,
    rm,
    clear,
  };
};
