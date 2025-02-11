import { Input } from "~/components/ui/input";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";
import { getWebContainerP } from "~/wc/web-container.client";
import { importFromLocalSystem } from "~/lib/local-fs-importer";
import { gitClone } from "~/lib/git-cloner";
import { Loader2 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [gitUrl, setGitUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const handleGitClone = async () => {
    if (!gitUrl) return;

    try {
      setLoading(true);
      getWebContainerP().create(await gitClone(gitUrl));
      navigate("/editor");
    } catch (error) {
      console.error("Failed to clone repository:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLocalFolder = async () => {
    try {
      setLoading(true);
      getWebContainerP().create(await importFromLocalSystem());
      navigate("/editor");
    } catch (error) {
      console.error("Failed to load local folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartFromScratch = () => {
    try {
      setLoading(true);
      navigate("/editor");
      getWebContainerP().create();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🚀 Welcome!</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        Start your project by importing a Git repository, loading a local folder, or creating a new one from scratch.
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* Fetch from Git URL */}
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">📂 Clone a Git Repository</h2>
          <Input
            type="text"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            placeholder="Enter Git repository URL"
            className="mb-3"
          />
          <Button disabled={!gitUrl || loading} onClick={handleGitClone} className="w-full">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Clone Repository"}
          </Button>
        </div>

        {/* Load from Local Folder */}
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">💻 Load from Local Folder</h2>
          <Button disabled={loading} onClick={handleLoadLocalFolder} className="w-full">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Load Folder"}
          </Button>
        </div>

        {/* Start from Scratch */}
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-2">✨ Start from Scratch</h2>
          <Button disabled={loading} onClick={handleStartFromScratch} className="w-full">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Start New Project"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
