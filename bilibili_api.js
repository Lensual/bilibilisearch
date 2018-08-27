﻿"use strict"
var http = require('https');
var querystring = require('querystring');

function get(host, path, query = '', referer = '') {
    var reqUrl = `${path}?${querystring.stringify(query)}`;
    var options = {
        hostname: host,
        path: reqUrl,
        method: 'GET',
        headers: {
            'Referer': referer
        }
    };
    return new Promise(function (resolve, reject) {
        http.get(options, (res) => {
            console.debug('状态码：', res.statusCode);
            //console.debug('返回头：', res.headers);
            if (res.statusCode !== 200) {
                reject(new Error(res.statusCode));
            }
            var rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    var parsedData = JSON.parse(rawData);
                    resolve(parsedData);
                    //console.debug(parsedData);
                } catch (e) {
                    console.debug(rawData);
                    reject(e);
                }

            });
        }).on('error', (e) => {
            reject(e);
        });
    });


}

module.exports = class BilibiliApi {
    constructor(options = { apiHost : 'api.bilibili.com', apiPathPerfix : '/x/web-interface', https : true}) {
        //api地址
        this.apiHost = options.apiHost;
        this.apiPathPerfix = options.apiPathPerfix;

        if (options.https) http = require('https');
    }

    //搜索
    search(keyword = '', search_type = 'video', form_source = 'banner_search', page = 1, order = 'pubdate', tids = 3) {
        var reqPath = this.apiPathPerfix + '/search/all';
        return get(this.apiHost, reqPath, {
            'keyword': keyword,
            'search_type': search_type,
            'form_source': form_source,
            'page': page,
            'order': order,
            'tids': 3
        }, 'https://search.bilibili.com');
    }


    //视频信息
    videoInfo(aid) {
        var reqPath = this.apiPathPerfix + '/archive/stat';
        return get(this.apiHost, reqPath, {
            'aid': aid
        }, `https://www.bilibili.com/video/av${aid}`);
    }
}

