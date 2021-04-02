const { createCanvas, Image } = require(`canvas`);
const fileLoader = require(`file-loader`);

module.exports = function loader(content, fileInfo = { sources: [] }) {
  let img = new Image();
  const svg64 = `data:image/svg+xml;base64,${Buffer.from(content).toString(
    "base64"
  )}`;
  img.src = svg64;
  const canvas = createCanvas(img.width / 5, img.height / 5);
  const context2d = canvas.getContext(`2d`);
  context2d.drawImage(img, 0, 0, img.width / 5, img.height / 5);
  console.log(img.width / 5, img.height / 5);
  const thumbnail = canvas.toDataURL("image/png");

  const fileName = fileLoader
    .call(
      Object.assign({}, this, {
        query: {
          name: `[name].[ext]`,
          esModule: true,
        },
      }),
      content
    )
    .replace(`module.exports =`, ``)
    .replace(`;`, ``);

  return {
    fileName,
    thumbnail,
  };
};
