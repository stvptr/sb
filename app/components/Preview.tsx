import { useServers } from "~/wc/web-container.client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

const Preview = () => {
  const servers = useServers();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="border-b p-4 text-lg font-semibold">Preview</h1>
      {servers.length > 0 ? (
        <Tabs className="flex flex-1 flex-col">
          <div className="overflow-x-auto">
            <TabsList>
              {servers.map((server) => (
                <TabsTrigger key={server} value={server}>
                  <span className="max-w-28 overflow-hidden">{server}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex-1">
            {servers.map((server) => (
              <TabsContent
                key={server}
                value={server}
                className="h-full w-full"
              >
                <iframe src={server} className="h-full w-full border-none" />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <p className="p-4 text-gray-500">No server open to preview</p>
      )}
    </div>
  );
};

export default Preview;
