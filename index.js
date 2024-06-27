import { Octokit } from "@octokit/core";
import { parse } from "pb-text-format-to-json";
import atob from "atob";

const octokit = new Octokit({
  auth: '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' 
});

async function fetchFontFile(owner, repo, filepath){
  try {
    const res = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: owner,
      repo: repo,
      path: filepath,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (res.data.download_url)
    return res.data.download_url;
  } catch (error) {
    console.error(error);
    return null;
  }
}

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
    return res.data;  // Adjust slice as per your requirement
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
    if(res.data.content){
      const content = atob(res.data.content);
      const output = parse(content);
      return output;
    }
    return null;
  } catch (error) {
    if (error.status === 404){
      return null;
    }
    else{
      console.error(error);
    }
    return null;
  }
}

(async () => {
  const owner = 'google';
  const repo = 'fonts';
  const path = '/ofl';
  var fontObjList = [];
  try {
    const fontsList = await fetchFonts(owner, repo, path);
    for (const font of fontsList) {
      const metadataPath = font.path + '/METADATA.pb';
      const metadata = await fetchMetadata(owner, repo, metadataPath);
      if (metadata){
        var fontObj = {
          name: metadata.name,
          description: "",
          type: metadata.category,
          supports: [],
          fonts: []
        };
  
        const fonts = metadata.fonts;
  
        if (fonts && Array.isArray(fonts)) {
          for (const type of fonts) {
            // const fontURLPath = font.path + '/' + type.filename;
            // const fontfileURL = await fetchFontFile(owner, repo, fontURLPath);
            // if (fontObj.supports.indexOf(type.style) === -1) {
            //   fontObj.supports.push(type.style);
            // }
            // fontObj.description += type.post_script_name + "-" + type.weight + " ";
            // fontObj.fonts.push({
            //   fontName: type.post_script_name,
            //   url: fontfileURL,
            //   weight: type.weight
            // });
          }
        } else if (fonts && typeof fonts === 'object') {
          // Handle single font object case
          // const type = fonts;
          // const fontURLPath = font.path + '/' + type.filename;
          // const fontfileURL = await fetchFontFile(owner, repo, fontURLPath);
          // if (fontObj.supports.indexOf(type.style) === -1) {
          //   fontObj.supports.push(type.style);
          // }
          // fontObj.description += type.post_script_name + "-" + type.weight + " ";
          // fontObj.fonts.push({
          //   fontName: type.post_script_name,
          //   url: fontfileURL,
          //   weight: type.weight
          // });
        }
  
        fontObjList.push(fontObj);
      }
    }
    console.log(fontObjList.length);
  } catch (error) {
    console.log("Container TRY Block: " + error);
  }
})();
