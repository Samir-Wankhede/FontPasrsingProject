fetch('../fontObjList.json')
  .then(response => response.json())
  .then(fontObjList => {
    console.log(fontObjList)
    const container = document.getElementById('font-container');
    
    fontObjList.forEach(font => {
      // Create a @font-face rule
        font.fonts.forEach(type => {
            const styleSheet = document.styleSheets[0];
        const fontFaceRule = `
            @font-face {
            font-family: '${font.name}';
            src: url('${type.url}');
            font-weight: ${type.weight};
            font-style: ${type.style};
            }
        `;
        styleSheet.insertRule(fontFaceRule, styleSheet.cssRules.length);

        // Create a div element for each font
        const div = document.createElement('div');
        div.style.fontFamily = font.name;
        div.style.fontWeight = type.weight;
        div.style.fontStyle = type.style;
        div.innerText = font.name;
        container.appendChild(div);
        
      })
    });
  })
  .catch(error => console.error('Error loading font data:', error));
