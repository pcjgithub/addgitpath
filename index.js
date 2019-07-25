/**
 * intro 自动获取git的远程路径注入
 * arthur pancj
 * date 2019-07-05
 */
"use strict";
const fs = require("fs");
const join = require("path").join;
let canPaly = true
/**
 * 获取git远程路径和本地js的路径，最后执行写入操作
 * @param {buildPath} 打包之后根路径,如果config文件选择从config文件读取，否则默认为dist
 * @param {mainJsPath} 选择加入路径的js文件，1为仅在main_hash.js或index_hash.js写入，2为在所有.js文件下写入路径，1为默认值
 */
const isMainJsPath = getParams("--mainJsPath=") === 2;
/**
 * 判断是否存在paths文件目录
 */
if(!process.env.npm_lifecycle_script){
  canPaly = false;
  console.log("failed to get params")
}
const PathArr = !getParams("--buildPath=")&&fs.existsSync('config/paths.js')?require("../../config/paths"):{};
const tasks =[getGitPath, getDistFiles, writePath];
const buildPath =getParams("--buildPath=")?getParams("--buildPath="):PathArr.appBuild?PathArr.appBuild.split("/")[PathArr.appBuild.split("/").length-1]:"dist";
if(!fs.existsSync(buildPath)){
  canPaly = false;
  console.log("can not get build path")
}
function getParams(str){
  if(process.env.npm_lifecycle_script.indexOf(str)<0) return false
  return (process.env.npm_lifecycle_script+" ").split(str)[1].split(" ")[0]
}
function next(...result) {
  if (tasks.length > 0) {
    tasks.shift()(result);
  } else {
    console.log("failed to read scripts")
    return;
  }
}
function getGitPath() {
  fs.readFile(".git/config", "utf-8", (error, data) => {
    if (error) {
      return console.log("Failed to read '.git' file");
    } else {
   
      const gitPath = data.split("url")[1].split(".git")[0].split(":")[1];
    
      next(gitPath);
    }
  });
}
function getDistFiles(result) {
  let distTotalArr = [];
  function findDistFile(path) {
    let files = fs.readdirSync(path);
    files.forEach(function(item, index) {
      let fPath = join(path, item);
      let stat = fs.statSync(fPath);
      if (stat.isDirectory() === true) {
        findDistFile(fPath);
      }
      if (stat.isFile() === true) {
        distTotalArr.push(fPath);
      }
    });
  }
  findDistFile(buildPath);
  const filterRegular = !isMainJsPath ? /^(main|index|app|default|base)[\w-\.\s\(\)\（\）]*\.js$/ : /^[\w-\.\s\(\)\（\）]+\.js$/;
  const distArr = distTotalArr.filter(path =>
    filterRegular.test(path.indexOf("/")>-1?path.split("/")[path.split("/").length - 1]:path.split("\\")[path.split("\\").length - 1])
  );
  console.log(distArr.length);
  if (distArr.length && isMainJsPath) {
    next(result.join(""), distArr[0]);
  } else if (distArr.length && !isMainJsPath) {
    next(result.join(""), distArr);
  } else {
    return console.log("Failed to get local file path");
  }
}
function writePath(result) {
  if (result.length === 2) {
    if (!Array.isArray(result[1])) {
      fs.readFile(result[1], "utf-8", (error, data) => {
        if (error) {
          return console.log("Failed to read remote directory");
        } else {
          if (isMainJsPath) {
            fs.appendFile(
              result[1],
              "\r\n\n\r;//# Romote_Git_Path=" + result[0] + ";\r\n\n\r",
              error => {
                if (error) return console.log("Failed to write gitPath" + error.message);
                console.log("success write gitPath");
              }
            );
          }
        }
      });
    }else{
      result[1].map(item=>{
        fs.appendFile(
          item,
          "\r\n\n\r;//# Romote_Git_Path=" + result[0] + ";\r\n\n\r",
          error => {
            if (error)
              return console.log("写入文件失败,原因是" + error.message);
              console.log("success write gitPath");
          }
        );
      })
    }
  }
}
if(canPaly){
  next();
}
