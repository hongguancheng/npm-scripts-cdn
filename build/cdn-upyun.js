'use strict';

var mime = require('mime');
var path = require('path');
var fs = require("fs");
var crypto = require("crypto");
var request = require('request');

var config = {
  bucket: process.env.npm_package_config_upyun_bucket,
  token: process.env.npm_package_config_upyun_token,
  expiration: process.env.npm_package_config_upyun_expiration,
  dir: process.env.npm_package_config_upyun_dir,
  dest: process.env.npm_package_config_upyun_dest
}

function upyun(bucket, token, expiration) {
    this._conf = {
        bucket : bucket,
        token : token,
        expiration : expiration,
        endpoint : 'v0.api.upyun.com'
    };
}

upyun.prototype.getConf = function(key) {
    if(this._conf[key]) {
        return this._conf[key];
    }
};

upyun.prototype.setConf = function(key, value) {
    this._conf[key] = value;
};

upyun.prototype.md5sum = function(data) {
    var md5 = crypto.createHash('md5');
    md5.update(data, 'utf8');
    return md5.digest('hex');
};

upyun.prototype.makeSign = function(uri, type){
    if(uri.indexOf('?') >= 0) {
        uri = uri.split('?')[0];
    }

    var api_args = {
      bucket: this._conf.bucket,
      'save-key': uri,
      expiration: parseInt(new Date().getTime()/1000) + this._conf.expiration,
      'content-type': type
    };

    var policy = new Buffer(JSON.stringify(api_args), 'utf8').toString('base64');
    var signature = this.md5sum(policy + "&" + this._conf.token);
    return {
      policy: policy,
      signature: signature
    };
};

upyun.prototype.upload = function (remotePath, localFile, type, callback) {
  if(typeof arguments[arguments.length - 1] !== 'function') {
        throw new Error('No callback specified.');
    }
    callback = arguments[arguments.length - 1];

    var sign = this.makeSign(remotePath, type);

    var url = "http://" + this._conf.endpoint + '/' + this._conf.bucket;

    var req = request.post(url, function (err, resp, body) {
      if (err) {
        callback(err);
      } else {
        callback(null, resp, JSON.parse(body));
      }
    });
    var form = req.form();
    form.append('policy', sign.policy);
    form.append('signature', sign.signature);
    form.append('file', fs.createReadStream(localFile));
};

function fillFilePath(dir){
  var files = fs.readdirSync(dir);
  var len = files.length;
  var file = null;
  for(var i=0;i<len;i++){
    file = files[i];
    addFilePath(dir+"/"+file);
  }
}

function addFilePath(filepath) {
  var stats = fs.statSync(filepath)
  if (stats.isFile()) {
    filepaths.push(filepath)
  } else if (stats.isDirectory()) {
    fillFilePath(filepath);
  } else {
    console.log("unknow type of file");
  }
}

var filepaths = [];
var client = new upyun(config["bucket"], config["token"], config['expiration']);

console.log(JSON.stringify(config), "\n")

fillFilePath(config.dir);

filepaths.forEach(function(file) {
  var dest = config.dest + file.substring(config.dir.length),
      filepath = file;
  client.upload(dest, filepath, mime.lookup(filepath), function(err, resp, body){
    if (err) {
      console.log(dest, err.msg);
    } else {
      var statusCode = resp.statusCode, statusMessage = resp.statusMessage;
      if (body) {
        statusCode = body.code;
        statusMessage = body.message;
      }
      console.log(dest, statusCode, statusMessage)
    }
  });
})