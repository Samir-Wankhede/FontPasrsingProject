import fs from 'fs';
import path from 'path';
import { parse } from 'pb-text-format-to-json';

const __dirname = './'
// Function to read files from the filesystem
async function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Function to read directories from the filesystem
async function readDirectory(dirPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

// Function to fetch font file URL (in this case, construct the local file path)
function fetchFontFile(basePath, fontFileName) {
  const filePath = path.join(basePath, fontFileName);
  if (fs.existsSync(filePath)) {
    return `https://rs.profiledraft.com/rs/webfonts/google/${filePath}`;
  } else {
    return null;
  }
}

// Function to fetch fonts from the local directory
async function fetchFonts(dirPath) {
  const files = await readDirectory(dirPath);
  const directories = files.filter(file => fs.statSync(path.join(dirPath, file)).isDirectory());
  return directories.slice(0); // Return only the first 2 directories
}

// Function to fetch metadata from the local METADATA.pb file
async function fetchMetadata(fontDir) {
  const metadataPath = path.join(fontDir, 'METADATA.pb');
  if (fs.existsSync(metadataPath)) {
    const content = await readFile(metadataPath);
    return parse(content);
  } else {
    return null;
  }
}

// Main function to process the fonts
(async () => {
  const baseDir = path.join(__dirname, 'ofl');
  const fontObjList = [];
  const fontFaceList = [];
  const fontCategoryies = [];
  const fontFaceSQL = [];

  try {
    const fontsList = await fetchFonts(baseDir);
    for (const font of fontsList) {
      const fontDir = path.join(baseDir, font);
      const metadata = await fetchMetadata(fontDir);
      if (metadata) {
        const fontObj = {
            name: metadata.name,
            description: '',
            type: [],
            supports: [],
            fonts: []
        };
        if (metadata.category && Array.isArray(metadata.category)){
            metadata.category.forEach(element => {
                var ele = element.toLowerCase();
                if (ele === 'sans_serif'){
                    ele = 'sans-serif';
                }
                if (ele === 'display'){
                    ele = 'sans-serif';
                }
                if (ele === 'handwriting'){
                    ele = 'cursive';
                }
                if (fontObj.type.indexOf(ele) === -1){
                    fontObj.type.push(ele);
                }
            });
        }
        else{
            var ele = metadata.category.toLowerCase();
            if (ele === 'sans_serif'){
                ele = 'sans-serif';
            }
            if (ele === 'display'){
                ele = 'sans-serif';
            }
            if (ele === 'handwriting'){
                ele = 'cursive';
            }
            if (fontObj.type.indexOf(ele) === -1){
                fontObj.type.push(ele);
            }
        }
        const fonts = metadata.fonts;

        if (fonts && Array.isArray(fonts)) {
          for (const type of fonts) {
            const fontfileURL = fetchFontFile(fontDir, type.filename);
            if (fontObj.supports.indexOf(type.style) === -1) {
              fontObj.supports.push(type.style);
            }
            fontObj.description += type.post_script_name + '-' + type.weight + ' ';
            fontObj.fonts.push({
              fontName: type.post_script_name,
              url: fontfileURL,
              weight: type.weight,
              style: type.style
            });
          }
        } else if (fonts && typeof fonts === 'object') {
          // Handle single font object case
          const type = fonts;
          const fontfileURL = fetchFontFile(fontDir, type.filename);
          if (fontObj.supports.indexOf(type.style) === -1) {
            fontObj.supports.push(type.style);
          }
          fontObj.description += type.post_script_name + '-' + type.weight + ' ';
          fontObj.fonts.push({
            fontName: type.post_script_name,
            url: fontfileURL,
            weight: type.weight,
            style: type.style
          });
        }

        fontObjList.push(fontObj);
        }
    }
    for( const font of fontObjList){
        font.type.forEach(ele => {
            //consolelog to see family
            if (fontCategoryies.indexOf(ele) === -1) {
                fontCategoryies.push(ele);
            }
        })
        const fontFaceObj = {
            name: font.name,
            description: font.description,
            family: font.type,
            fallback: 'serif',
            supports: font.supports,
            fontFace: ""
        }
        font.fonts.forEach(type => {
            const fontFaceRule = `@font-face { font-family: ${font.name}; src: url(${type.url}); font-weight: ${type.weight}; font-style: ${type.style};}`;
            fontFaceObj.fontFace += fontFaceRule;
        })
        fontFaceList.push(fontFaceObj);
    }
    

    try{
        var id = 200;
        for (const font of fontFaceList){
            var Val = `VALUES (${id}, 'users_q45ZKZEZHa6beVptHtdn', 'q46Z7CDzOZcBSEb', 'admin', NOW(), NULL, b'0', 'q46Z7CDzOZcBSEb', 'admin', 'q46Z7CDzOZcBSEb', 'admin', b'0', 'InDevelopment', 'ts_r11ZkZKy0ddJDgAKaFddc${id}', 'q46Z7CDzOZcBSEb', NOW(), 0, NULL, '${font.description}', '', '${font.family}', NULL, '${font.fontFace}', '', '${font.name}', '${font.supports.toString()}');`;
            fontFaceSQL.push(
                "INSERT INTO \`font_family\` (\`id\`, \`client_uid\`, \`created_by\`, \`created_by_user\`, \`created_date\`, \`latest_version_uid\`, \`marked_as_deleted\`, \`owned_by\`, \`owned_by_user\`, \`permanent_owned_by\`, \`permanent_owned_by_user\`, \`private_resource\`, \`status\`, \`uid\`, \`updated_by\`, \`updated_date\`, \`version\`, \`aspect_value\`, \`description\`, \`fall_back\`, \`family\`, \`files_string\`, \`font_face\`, \`imports_string\`, \`name\`, \`supports\`)" + Val + '\n'
            )
            id += 1;
        }
    }catch (error){
        console.log('query Error: ' + error);
    }
    fs.writeFileSync('fontObjList.txt', (fontFaceSQL.join('')));
    console.log('Font data has been written to fontObjList.json');
  } catch (error) {
    console.log('Container TRY Block: ' + error);
  }
})();

