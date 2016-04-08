# npm-scripts-cdn
> use npm scripts to upload file to cdn

## Usage Examples
添加下列配置到你的 package.json

```json
"scripts": {
  "cdn-upyun": "node build/cdn-upyun.js"
},
"config": {
  "upyun": {
    "bucket": "test-static", // target bucket
    "token": "", // token
    "expiration": 5000,
    "dir": "./dist", // local dir
    "dest": "/test/grunt" // upyun target uri prefix
  }
},
```

运行 npm run cdn-upyun 把 dist 文件夹的所有文件上传到又拍云
