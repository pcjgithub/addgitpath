/**
 * intro 自动获取git的远程路径注入
 * arthur pancj
 * date 2019-07-05
 */
"use strict";
const fs = require("fs");
const join = require("path").join;
const chalk = require("chalk");
const Logs = (str,type="warn")=>{
  switch (type){
    case "succ": 
        return console.log(chalk.yellow.bgGreen.bold('Success!')+chalk.green(str));
    case "warn":
        return console.log(chalk.red.bold('Failed! %s'),str);
    default:
        break;
  }
}
let canPaly = true;
const npm_lifecycle_script = process.env.npm_lifecycle_script+" " || "";
/**
 * 获取git远程路径和本地js的路径，最后执行写入操作
 * @param {buildPath} 打包之后根路径,如果config文件选择从config文件读取，否则默认为dist
 * @param {mainJsPath} 选择加入路径的js文件，1为仅在main_hash.js或index_hash.js写入，2为在所有.js文件下写入路径，1为默认值
 */
const isMainJsPath = getParams("--mainJsPath=")*1 === 2;
/**
 * 判断是否存在paths文件目录
 */
if(!npm_lifecycle_script){
  canPaly = false;
  Logs("unable to get params");
}
const PathArr = !getParams("--buildPath=")&&fs.existsSync('config/paths.js')?require("../../config/paths"):{};
const tasks =[getGitPath, getDistFiles, writePath];
const buildPath =getParams("--buildPath=")?getParams("--buildPath="):PathArr.appBuild?PathArr.appBuild.split("/")[PathArr.appBuild.split("/").length-1]:"dist";
if(!fs.existsSync(buildPath)){
  canPaly = false;
  Logs("unable to get the packing path")
}
function getParams(str){
  if(npm_lifecycle_script.indexOf(str)<0) return false
  return (npm_lifecycle_script).split(str)[1].split(" ")[0]
}
function next(...result) {
  if (tasks.length > 0) {
    tasks.shift()(result);
  } else {
    Logs("you maybe need add adjust scripts commands");
    return;
  }
}
function getGitPath() {
  fs.readFile(".git/config", "utf-8", (error, data) => {
    if (error) {
      return Logs("please make sure you have '.git' file");
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
  const filterRegular =  !isMainJsPath ? /^(main|index|app|default|base)[\w-.\s()（）]*\.js$/ : /^[\w-.\s()（）]+\.js$/;
  const distArr = distTotalArr.filter(path =>
    filterRegular.test(path.indexOf("/")>-1?path.split("/")[path.split("/").length - 1]:path.split("\\")[path.split("\\").length - 1])
  );
  if (distArr.length && !isMainJsPath) {
    next(result.join(""), distArr[0]);
  } else if (distArr.length && isMainJsPath) {
    next(result.join(""), distArr);
  } else {
    return isMainJsPath?Logs("make sure that the files you pack contain '.js' files"):Logs("make sure that the pack path  contain 'main*.js|base*.js|index*.js|default*.js|app*.js' file or add --mainJsPath=2 to your scripts command");
  }
}
function writePath(result) {
  if (result.length === 2) {
    if (!Array.isArray(result[1])) {
      fs.readFile(result[1], "utf-8", (error, data) => {
        if (error) {
          return Logs("unable to read remote directory");
        } else {
          if (isMainJsPath) {
            fs.appendFile(
              result[1],
              "\r\n\n\r;//# Romote_Git_Path=" + result[0] + ";\r\n\n\r",
              error => {
                if (error) return Logs("failed to write in" + error);
                Logs("success write in","succ");
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
            if (error) return Logs("failed to write in," + error);
            Logs("success write in","succ");
          }
        );
      })
    }
  }
}
if(canPaly){
  next();
}
