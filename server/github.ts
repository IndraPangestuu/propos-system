import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export async function getGitHubUser() {
  const octokit = await getUncachableGitHubClient();
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function createRepository(repoName: string, description: string, isPrivate: boolean = false) {
  const octokit = await getUncachableGitHubClient();
  
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      private: isPrivate,
      auto_init: false,
    });
    return data;
  } catch (error: any) {
    if (error.status === 422) {
      const user = await getGitHubUser();
      const { data } = await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      return data;
    }
    throw error;
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = [], basePath: string = dirPath): string[] {
  const files = fs.readdirSync(dirPath);
  const ignoreDirs = ['node_modules', '.git', '.replit', 'replit.nix', '.upm', '.cache', '.config', '.local', 'attached_assets', 'dist', '.npm'];
  const ignoreFiles = ['.replit', 'replit.nix', '.gitignore', '.env', 'package-lock.json'];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    
    if (ignoreDirs.includes(file) || file.startsWith('.')) {
      continue;
    }
    
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getAllFiles(fullPath, arrayOfFiles, basePath);
      } else {
        if (!ignoreFiles.includes(file) && stat.size < 1000000) {
          const relativePath = path.relative(basePath, fullPath);
          arrayOfFiles.push(relativePath);
        }
      }
    } catch (e) {
    }
  }

  return arrayOfFiles;
}

export async function pushToGitHub(repoName: string, description: string, isPrivate: boolean = false) {
  const octokit = await getUncachableGitHubClient();
  const user = await getGitHubUser();
  
  let repo;
  let isNewRepo = false;
  
  try {
    const { data } = await octokit.repos.get({
      owner: user.login,
      repo: repoName,
    });
    repo = data;
  } catch (error: any) {
    if (error.status === 404) {
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description,
        private: isPrivate,
        auto_init: true,
      });
      repo = data;
      isNewRepo = true;
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      throw error;
    }
  }
  
  const projectDir = process.cwd();
  const files = getAllFiles(projectDir);
  
  let uploadedCount = 0;
  const batchSize = 5;
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    for (const filePath of batch) {
      const fullPath = path.join(projectDir, filePath);
      const content = fs.readFileSync(fullPath);
      const base64Content = content.toString('base64');
      
      let existingSha: string | undefined;
      try {
        const { data } = await octokit.repos.getContent({
          owner: user.login,
          repo: repoName,
          path: filePath,
        });
        if (!Array.isArray(data) && data.type === 'file') {
          existingSha = data.sha;
        }
      } catch (e) {
      }
      
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: filePath,
        message: `Add ${filePath}`,
        content: base64Content,
        sha: existingSha,
      });
      
      uploadedCount++;
    }
  }
  
  return {
    url: repo.html_url,
    name: repo.name,
    owner: user.login,
    filesUploaded: uploadedCount,
  };
}
