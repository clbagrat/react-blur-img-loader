A webpack loader for progressive images wrapped as React component

```
options: {
  limit: 3000,
  thumbnailStyles: {
    border: '1px solid black'
  },
  imageStyles: {
    width: '100px',
    height: '100px,
  },
  fileLoader: {
    // here options for https://www.npmjs.com/package/file-loader
  }
}
```

example:

```
// webpack config:
{
  test: /\/illustrations\/.*\.svg$/,
  use: [
    {
      loader: `babel-loader`,
      options: javascriptOptions,
    },
    {
      loader: `react-blur-img-loader`,
      options: {
        limit: 100000,
        fileLoader: {
          name: `[name].[ext]`,
        },
      },
    }
  ]
}
```

```
import Image from '/assets/illustrations/bigImage.svg';

const MyReactComponent => () => {
  return (
    <Image imageStyles={...} thumbnailStyles={...} thumbnailClassName={...} className={...} {...rest}/>
  )
}
```
