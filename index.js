import { Octokit } from "@octokit/core";
import protobuf from "protobufjs";
import atob from "atob";

const octokit = new Octokit({
  auth: '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' 
});

async function fetchFonts(owner, repo, path) {
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: owner,
      repo: repo,
      path: path,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    return res.data.slice(0, 1);
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function fetchMetadata(owner, repo, fontPath) {
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: owner,
      repo: repo,
      path: fontPath,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const content = atob(res.data.content);
    console.log(content); // metadata.pb data convert this to json

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

(async () => {
  const owner = 'google';
  const repo = 'fonts';
  const path = '/ofl';

  const fontsList = await fetchFonts(owner, repo, path);
  console.log(fontsList)

  fontsList.forEach(async (font) => {
    const metadataPath = font.path + '/METADATA.pb';

    const metadata = await fetchMetadata(owner, repo, metadataPath);
    console.log(metadata);
  });
})();
