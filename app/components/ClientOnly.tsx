import { type ReactNode, useEffect, useState } from "react";

export const ClientOnly = ({ children, fallback }: { children: () => ReactNode, fallback?: ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted ? children() : fallback;
};