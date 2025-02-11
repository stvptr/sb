import type { Route } from "./+types/home";
import CodeView from "~/components/CodeView";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" }
  ];
}

export default function Home() {
  return <main className="h-screen">
    <CodeView />
  </main>;
}
