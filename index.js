const core = require("@actions/core");
const github = require("@actions/github");
const chalk = require("chalk");
var axios = require("axios");
const figlet = require("figlet");
var FormData = require("form-data");
var fs = require("fs");

const domain = "https://connect-api.cloud.huawei.com/api";

/**
 * get Token
 * @param  {} client_id
 * @param  {} client_key
 */
function getToken({ clientId, clientKey }) {
  console.log("Obtaining a Token .... ⌛️");
  var data = JSON.stringify({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientKey,
  });

  var config = {
    method: "post",
    url: `${domain}/oauth2/v1/token`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios(config);
}

/**
 *
 * Obtain the file upload URL.
 * @param clientId clientId
 * @param token token
 * @param appId App ID.
 * @param fileExt File name extension apk/rpk/pdf/jpg/jpeg/png/bmp/mp4/mov/aab.
 */
async function getUploadUrl({ appId, fileExt, clientId, token }) {
  console.log("Get Upload URL .... ⌛️");
  var config = {
    method: "get",
    url: `${domain}/publish/v2/upload-url?appId=${appId}&suffix=${fileExt}`,
    headers: {
      client_id: clientId,
      Authorization: `Bearer ${token}`,
    },
  };
  return await axios(config);
}

/**
 *
 * Submit the app.
 * @param clientId clientId
 * @param token token
 * @param appId App ID.
 */
async function submitApp({ appId, clientId, token }) {
  console.log("Submitting .... ⌛️");
  var config = {
    method: "post",
    url: `${domain}/publish/v2/app-submit?appId=${appId}`,
    headers: {
      client_id: clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  return await axios(config);
}

/**
 * Upload files.
 * @param clientId clientid
 * @param token token
 * @param appId App ID.
 * @param fileExt File name extension apk/rpk/pdf/jpg/jpeg/png/bmp/mp4/mov/aab.
 * @return  Response.
 */
function uploadFile({
  appId,
  fileExt,
  clientId,
  authCode,
  uploadUrl,
  filePath,
}) {
  console.log("Upload files .... ⤴️");

  var data = new FormData();
  data.append("authCode", authCode);
  data.append("fileCount", "1");
  data.append("file", fs.createReadStream(filePath));

  var config = {
    method: "post",
    url: uploadUrl,
    headers: {
      accept: "application/json",
      ...data.getHeaders(),
    },
    data: data,
    maxContentLength: 100000000,
    maxBodyLength: 1000000000,
  };

  return axios(config);
}

/**
 * Updating App File Information
 * @param  {} fileDestUrl
 * @param  {} size
 * @param  {} appId
 * @param  {} clientId
 * @param  {} token
 */
function updateAppFileInfo({ fileDestUrl, size, appId, clientId, token, fileExt }) {
  console.log("Update App File Info .... ⌛️");
  var data = JSON.stringify({
    fileType: "5",
    files: [
      {
        fileName: `app-release.${fileExt}`,
        fileDestUrl: fileDestUrl,
        size,
      },
    ],
  });

  var config = {
    method: "put",
    url: `${domain}/publish/v2/app-file-info?appId=${appId}`,
    headers: {
      client_id: clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios(config);
}

async function startDeply({ clientId, clientKey, appId, fileExt, filePath, submit }) {
  try {
    const newToken = await getToken({
      clientId,
      clientKey,
    });
    const uploadUrlInfo = await getUploadUrl({
      clientId,
      fileExt,
      appId,
      token: newToken.data.access_token,
    });
    const uploadInfo = await uploadFile({
      clientId,
      fileExt,
      appId,
      authCode: uploadUrlInfo.data.authCode,
      uploadUrl: uploadUrlInfo.data.uploadUrl,
      filePath,
    });
    if (uploadInfo.data.result.UploadFileRsp.ifSuccess) {
      console.log("upload successful ✅✅");
    } else {
      core.setFailed("upload Failed ❌❌");
    }
    const updateFileInfo = await updateAppFileInfo({
      token: newToken.data.access_token,
      clientId,
      appId,
      size: uploadInfo.data.result.UploadFileRsp.fileInfoList[0].size,
      fileDestUrl:
        uploadInfo.data.result.UploadFileRsp.fileInfoList[0].fileDestUlr,
      fileExt
    });
    if (updateFileInfo.data.ret.msg === "success") {
      console.log("successfully uploaded 🎉🎉🎉🎉🎉🎉");
      if (submit) {
        const submitResult = await submitApp({
          appId,
          clientId,
          token: newToken.data.access_token,
        });
        if (submitResult.data.ret.msg === "success") {
          console.log("successfully submitted 🎉🎉🎉🎉🎉🎉");
	} else {
          console.log(submitResult.data.ret.msg);
          core.setFailed(submitResult.data.ret.msg);
	}
      }
    } else {
      core.setFailed(updateFileInfo.data.ret.msg);
    }
  } catch (error) {
    core.setFailed(error);
  }
}

try {
  const clientId = core.getInput("client-id");
  const clientKey = core.getInput("client-key");
  const appId = core.getInput("app-id");
  const fileExt = core.getInput("file-extension");
  const filePath = core.getInput("file-path");
  const submit = core.getInput("submit");

  console.log(
    chalk.yellow(figlet.textSync("AppGallery", { horizontalLayout: "full" }))
  );

  startDeply({ clientId, clientKey, appId, fileExt, filePath, submit });
} catch (error) {
  core.setFailed(error.message);
}
