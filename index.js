/**
 * intro 自动获取git的远程路径注入
 * arthur pancj
 * date 2019-07-05
 */
"use strict";
const fs = require("fs");
const join = require("path").join;
/**
 * 获取git远程路径和本地js的路径，最后执行写入操作
 * @param {buildPath} 打包之后根路径,如果config文件选择从config文件读取，否则默认为dist
 * @param {mainJsPath} 选择加入路径的js文件，1为仅在main_hash.js或index_hash.js写入，2为在所有.js文件下写入路径，1为默认值
 */
//TODO Optimize node execution process
// const MainJsPath = process.env.npm_package_scripts_arthur.split(
//   "--mainJsPath="
// )[1]
//   ? process.env.npm_package_scripts_arthur.split("--mainJsPath=")[1]
//   : "1";
const MainJsPath = ""
const isMainJsPath = MainJsPath === "1";
/**
 * 判断是否存在paths文件目录
 */
const PathArr =fs.existsSync('config/paths.js')?require("../../config/paths"):{};
const tasks = [getGitPath, getDistFiles, writePath];
const buildPath =PathArr.appBuild?PathArr.appBuild.split("/")[PathArr.appBuild.split("/").length-1]:"dist";
function next(...result) {
  if (tasks.length > 0) {
    tasks.shift()(result);
  } else {
    return;
  }
}
function getGitPath() {
  fs.readFile(".git/config", "utf-8", (error, data) => {
    if (error) {
      return console.log("Failed to read '.git' file");
    } else {
      const gitPath = data.split(".git")[0].split("git@")[1].split(":")[1];
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
  const filterRegular = isMainJsPath ? /^(main|index)[a-zA-Z0-9_-]*\.js$/ : /^[a-zA-Z0-9_-]+\.js$/;
  const distArr = distTotalArr.filter(path =>
    filterRegular.test(path.indexOf("/")>-1?path.split("/")[path.split("/").length - 1]:path.split("\\")[path.split("\\").length - 1])
  );
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
              "\r\n\n\r;//# Romote_Git_Path =" + result[0] + ";\r\n\n\r",
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
          "\r\n\n\r;//# Romote_Git_Path =" + result[0] + ";\r\n\n\r",
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
next();
