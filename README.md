# addgitpath 

> Inject a function with a git remote path to the packaged js


## Install

```
$ npm install addgitpath

```


## Usage

```webpack scripts 

"scripts": {
    "build": "node scripts/build.js && node node_modules/addgitpath --mainJsPath=1",
}

mainJsPat:1 or 2
//Select the js file to join the path, 1 is written only in main_hash.js or index_hash.js, 2 is written in all .js files, 1 is the default value(选择加入路径的js文件，1为仅在main_hash.js或index_hash.js写入，2为在所有.js文件下写入路径，1为默认值)
// change function to comment
```

## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
