const { createCanvas, Image } = require(`canvas`);
const fileLoader = require(`file-loader`);
const { getOptions } = require("loader-utils");

module.exports = function loader(content) {
  const extensionMatch = this.resourcePath.match(/.(jpg|png|svg)$/i);
  if (!extensionMatch) {
    throw new Error(
      "unexpected file extension. Supported extension: jpg, svg, png"
    );
  }

  const options = getOptions(this) || {};

  const mimeTypes = {
    jpg: "jpg",
    png: "png",
    svg: "svg+xml",
  };

  const optThumbnailStyles = JSON.stringify(options.thumbnailStyles || {});
  const optImageStyles = JSON.stringify(options.imageStyles || {});

  const img64 = `data:image/${
    mimeTypes[extensionMatch[1]]
  };base64,${Buffer.from(content).toString("base64")}`;

  if (options.limit && content.length < options.limit) {
    return `
    import React, {useState} from 'react';

    export default function ({imageStyles = {width: "100%"}, ...rest}) {
      const optImageStyles = rest.className ? {} : {...${optImageStyles}, ...imageStyles};

      return (
        <React.Fragment>
          <img {...rest} src={"${img64}"} style={{ ...optImageStyles}} />
        </React.Fragment>
      )
    }
    `;
  }

  let img = new Image();
  img.src = img64;

  const { thumbnailMaxWidth = 50, thumbnailMaxHeight = 50 } = options;

  const maxWidth = Math.min(thumbnailMaxWidth, img.width);
  const maxHeight = Math.min(thumbnailMaxHeight, img.height);
  let width, height;
  if (img.width > img.height) {
    width = maxWidth;
    height = Math.max(img.height, thumbnailMaxHeight) * (maxWidth / img.width);
  } else {
    width = Math.max(img.width, thumbnailMaxWidth) * (maxHeight / img.height);
    height = maxHeight;
  }

  const canvas = createCanvas(width, height);
  const context2d = canvas.getContext(`2d`);
  canvas.height = height;
  context2d.drawImage(img, 0, 0, width, height);
  const thumbnail = canvas.toDataURL("image/png");

  const fileName = fileLoader
    .call(
      Object.assign({}, this, {
        query: options.fileLoader || {},
      }),
      content
    )
    .replace(`module.exports =`, ``)
    .replace(`export default`, ``)
    .replace(`;`, ``);

  return `
    import React, {useState} from 'react';

    export default function ({thumbnailStyles = { width: "100%" }, imageStyles = { width: "100%" }, thumbnailClassName, ...rest}) {
      const [loaded, setLoaded] = useState(false);
      const onLoad = () => {
        setLoaded(true);
      }
      const optThumbStyles = thumbnailClassName ? {} : {...${optThumbnailStyles}, ...thumbnailStyles};
      const optImageStyles = rest.className ? {} : {...${optImageStyles}, ...imageStyles};

      return (
        <React.Fragment>
          {!loaded && <img src="${thumbnail}" className={thumbnailClassName} style={{...optThumbStyles, filter: "blur(10px)"}} />}
          <img {...rest} src={${fileName}} style={{ ...optImageStyles, [!loaded && 'display']: "none"}} onLoad={onLoad} />
        </React.Fragment>
      )
    }
  `;
};

module.exports.raw = true;
