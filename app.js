"use strict"

var bilibiliapi = require('./bilibili_api');
var api = new bilibiliapi();

//关键词
var keywords = [
    false,
    '初音', 'miku', '初音未来', '初音ミク', 'ミク'
];
//屏蔽关键词
var keywordsBlacklist = [
    '演唱会',
	'中文曲',
	'中文原创',
	'中文翻唱',
	'v4c'
];

var test = [
    false,
    'v4c',
    'v4c'
];

//枚举a与b二元组
function x(arra, arrb) {
    var arr = [true];
    for (var a = 1; a < arra.length; a++) {
        for (var b = 1; b < arrb.length; b++) {
            arr.push(arra[a] + arrb[b]);
        }
    }
    return arr;
}

//返回有效数据从1开始的关键词数组
function mix(keywords) {

    var arr = [""];
    if (keywords[0]) {   //and
        arr.push("");
        for (var i = 1; i < keywords.length; i++) {
            var b;
            if (typeof (keywords[i]) == 'string') {
                b = keywords[i];
            } else {
                b = mix(keywords[i]);
            }
            arr = x(arr, b);

        }
    } else {  //or
        for (var i = 1; i < keywords.length; i++) {
            if (typeof (keywords[i]) == 'string') {
                arr.push(keywords[i]);
            } else {
                var t = mix(keywords[i]);
                for (var j = 1; j < t.length; j++) {
                    arr.push(t[j]);
                }
            }
        }
    }
    return arr;
}

function sleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function autoSleep(count) {
    if (!(count % 10)) {
        sleep(500);
    } else {
        sleep(100);
    }
}

main(keywords);

async function main(keywords) {
    var results = [];
    var karr = mix(keywords);
    var page = 1;
    var error = [];
    console.log("本次搜索关键词有：%s个", karr.length - 1);
    console.log("每关键词搜索页数：%s页", page);
    console.log("本次搜索次数：%s次", (karr.length - 1) * page);
    var count = 0;
    for (var i = 1; i < karr.length; i++) {
        console.log("关键词：" + karr[i]);
        for (var j = 1; j <= page; j++) {
            autoSleep(count);
            count++;

            var parsedData = null;
            try {
                parsedData = await api.search(karr[i], 'video', 'banner_search', j);
                //处理结果
                for (var k = 0; k < parsedData.data.result.video.length; k++) {
                    //删除标题中html标签
                    do {
                        var s = parsedData.data.result.video[k].title.indexOf('<');
                        var e = parsedData.data.result.video[k].title.indexOf('>');
                        if (s != -1 && e != -1) {
                            var a = parsedData.data.result.video[k].title.substring(0, s);
                            var b = parsedData.data.result.video[k].title.substring(e + 1);
                            parsedData.data.result.video[k].title = a + b;
                        }
                    } while (s != -1 || e != -1);
                    //屏蔽关键词过滤
                    for (var l = 0; l < keywordsBlacklist.length; l++) {
                        if (parsedData.data.result.video[k].title.indexOf(keywordsBlacklist[l]) != -1)    //标题
                            //|| parsedData.data.result.video[k].tag.indexOf(keywordsBlacklist[l]) != -1) {    //tag 会过滤多
                            parsedData.data.result.video.splice(k, 1);
                            k--
                            break;
                        }
                    }
                }
                results.push(parsedData.data.result.video);
            } catch (err) {
                error.push(err);
                console.error("出错关键词：%s", karr[i]);
                console.error("页码：%s", j);
                console.error(err);
                continue;
            }
        }
    }

    //合并结果
    var arr = [];
    for (var i = 0; i < results.length; i++) {
        arr = arr.concat(results[i]);
    }
    console.log("本次结果汇总有：%s个", arr.length);

    //结果去重
    for (var i = 0; i < arr.length; i++) {
        for (var j = i + 1; j < arr.length; j++) {
            if (arr[i].aid === arr[j].aid) {
                arr.splice(j, 1);
                j--;
            }
        }
    }
    console.log("本次结果去重有：%s个", arr.length);

    //获取详细信息
    for (var i = 0; i < arr.length; i++) {
        autoSleep(count);
        count++;
        console.log("获取详细信息：%s/%s", i + 1, arr.length)
        try {
            parsedData = await api.videoInfo(arr[i].aid);
            Object.assign(arr[i], parsedData.data);
        } catch (err) {
            console.error(err);
            continue;
        }
    }
    console.log('生成xlsx...')
    toXlsx("banner_search", arr);


}


function toXlsx(name, arr) {
    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    var sheet = workbook.addWorksheet('My Sheet');

    var columns = [
        { header: 'av号', key: 'aid' },
        { header: '标题', key: 'title' },
        { header: '作者', key: 'author' },
        { header: '投稿分区', key: 'typename' },
        { header: 'TAG', key: 'tag' },
        { header: '总播放数', key: 'view' },
        { header: '收藏人数', key: 'favorite' },
        { header: '总弹幕数', key: 'danmaku' },
        { header: '评论数量', key: 'reply' },
        { header: '硬币数量', key: 'coin' },
        { header: '分享人数', key: 'share' },
        { header: '最高全站日排行', key: 'his_rank' },
        { header: '现在全站日排行', key: 'now_rank' },
        { header: '版权声明', key: 'copyright' }, // 1未经作者授权 禁止转载 //2未注明
        { header: '发布日期', key: 'pubdate' },
        //{ header: '查询日期', key: 'senddate' }  //未知
        { header: '描述', key: 'description' },
    ];

    sheet.columns = columns;

    for (var i = 0; i < arr.length; i++) {
        //处理字段内容
        arr[i].pubdate = formateDate(arr[i].pubdate);
        arr[i].senddate = formateDate(arr[i].senddate);
        //添加到表格
        sheet.addRow(arr[i]);
    }

    //sheet.addRow([3, 'Sam', new Date()]);

    workbook.xlsx.writeFile('./' + name + '.xlsx')
        .then(function () {
            // done
        });

}

function formateDate(timeStamp) {
    var unixTimestamp = require('unix-timestamp');
    var date = unixTimestamp.toDate(timeStamp)
    //yyyy-MM-dd HH:mm:ss
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

}
