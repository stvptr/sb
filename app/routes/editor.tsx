import type { Route } from "./+types/home";
import CodeView from "~/components/CodeView";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Code editor" },
  ];
}

export default function EditorPage() {
  return <main className="h-screen">
    <CodeView />
  </main>;
}
