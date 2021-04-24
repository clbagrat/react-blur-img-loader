const sharp = require("sharp");
const fileLoader = require(`file-loader`);
const { getOptions } = require("loader-utils");

module.exports = async function loader(content) {
  const extensionMatch = this.resourcePath.match(/.(jpg|jpeg|png|svg)$/i);

  if (!extensionMatch) {
    throw new Error(
      "unexpected file extension. Supported extension: jpg, svg, png"
    );
  }

  const options = getOptions(this) || {};

  const callback = this.async();

  const mimeTypes = {
    jpg: "jpg",
    jpeg: "jpeg",
    png: "png",
    svg: "svg+xml",
  };

  const optThumbnailStyles = JSON.stringify(options.thumbnailStyles || {});
  const optImageStyles = JSON.stringify(options.imageStyles || {});

  if (options.limit && content.length < options.limit) {
    const img64 = `data:image/${
      mimeTypes[extensionMatch[1]]
    };base64,${Buffer.from(content).toString("base64")}`;

    callback(
      null,
      `
    import React, {useState} from 'react';

    export default function ({imageStyles = {width: "100%"}, ...rest}) {
      const optImageStyles = rest.className ? {} : {...${optImageStyles}, ...imageStyles};

      return (
        <React.Fragment>
          <img {...rest} src={"${img64}"} style={{ ...optImageStyles}} />
        </React.Fragment>
      )
    }
    `
    );
  }

  const thumbnailBuffer = await sharp(content)
    .metadata()
    .then(({ width, height }) => {
      const { thumbnailMaxWidth = 50, thumbnailMaxHeight = 50 } = options;

      const maxWidth = Math.min(thumbnailMaxWidth, width);
      const maxHeight = Math.min(thumbnailMaxHeight, height);
      let targetWidth, targetHeight;
      if (width > height) {
        targetWidth = maxWidth;
        targetHeight =
          Math.max(height, thumbnailMaxHeight) * (maxWidth / width);
      } else {
        targetWidth = Math.max(width, thumbnailMaxWidth) * (maxHeight / height);
        targetHeight = maxHeight;
      }

      return sharp(content)
        .toFormat("png")
        .resize({
          width: Math.round(targetWidth),
          height: Math.round(targetHeight),
        })
        .toBuffer();
    });

  const thumbnail = `data:image/png;base64,${thumbnailBuffer.toString(
    "base64"
  )}`;

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

  const result = `
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
  callback(null, result);
};

module.exports.raw = true;
