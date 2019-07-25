# addgitpath 

> Inject a function with a git remote path to the packaged js


## Install

```
$ npm install addgitpath

```


## Usage

```webpack scripts 

"scripts": {
    "build": "node scripts/build.js && node node_modules/addgitpath --mainJsPath=1 --buildPath=dist",
}
buildPath：如果config下有paths.js文件或者为dist目录可以不需要传，其他情况需要传入buildPath参数
mainJsPath:1 or 2选择加入路径的js文件，1为仅在base_hash.js或app_hash.js或default_hash.jsmain_hash.js或index_hash.js写入，2为在所有.js文件下写入路径，1为默认值
// change function to comment
//fit webpack 
//add build path param
```

## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
