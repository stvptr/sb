import type { FileSystemTree } from "@webcontainer/api";

type GitHubBlob = {
  type: "blob";
  name: string;
  object: {
    text: string;
  };
};

type GitHubTree = {
  type: "tree";
  name: string;
  object: {
    entries: GitHubEntry[];
  };
};

type GitHubResponse = {
  data: {
    repository: {
      object: {
        entries: GitHubEntry[];
      };
    };
  };
};

type GitHubEntry = GitHubBlob | GitHubTree;

const parseGitUrl = (url: string) => {
  const urlPattern =
    /^(https:\/\/github\.com\/([^\/]+)\/([^\/]+))(\/tree\/([^\/]+)(\/.*)?)?$/;
  const match = url.match(urlPattern);
  if (!match) {
    throw new Error("Invalid Git URL");
  }
  return {
    owner: match[2]!,
    name: match[3]!,
    branch: match[5] || "main",
    path: match[6] || "",
  };
};

const fetchGitHubRepo = async (gitUrl: string) => {
  const { owner, branch, name, path } = parseGitUrl(gitUrl);
  const expression = path ? `${branch}:${path}` : `${branch}:`;
  const variables = {
    owner,
    name,
    expression,
  };
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if(!response.ok){
    throw new Error("Failed to fetch GitHub repo");
  }

  const result: GitHubResponse = await response.json();
  return result.data.repository.object.entries;
};

export const gitCloneGql = async (gitUrl: string) => {
  const entries = await fetchGitHubRepo(gitUrl);
  return buildFileSystemTreeFromGitHub(entries);
};

const buildFileSystemTreeFromGitHub = async (
  entries: any[],
): Promise<FileSystemTree> => {
  const tree: FileSystemTree = {};

  for (const entry of entries) {
    if (entry.type === "tree") {
      tree[entry.name] = {
        directory: await buildFileSystemTreeFromGitHub(entry.object.entries),
      };
    } else if (entry.type === "blob") {
      tree[entry.name] = {
        file: {
          contents: entry.object.text,
        },
      };
    }
  }

  return tree;
};

const query = `
    query($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  text
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        text
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
