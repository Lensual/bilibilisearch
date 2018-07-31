"use strict"

var bilibiliapi = require('./bilibili_api');
var api = new bilibiliapi();

//关键词
var keywordsb = [
    false,
    'v4c',
    [
        true,
        [
            false,
            '初音', 'miku', '初音未来', '初音ミク', 'ミク'
        ],
        [
            false,
            '中文', '中文曲', '中文原创', '中文翻唱'
        ]
    ]
];

var keywords = [
    false,
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

main();

async function main() {
    var results = [];
    var karr = mix(keywords);
    var page = 10;
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
            } catch (err) {
                error.push(err);
                console.error(err);
                continue;
            }
            results.push(parsedData);
            //if (results.length < (karr.length - 1) * page - error.length)
            //    continue;

        }
    }

    //合并结果
    var arr = [];
    for (var i = 0; i < results.length; i++) {
        arr = arr.concat(results[i].data.result.video);
    }
    console.log("本次结果汇总有：%s个", arr.length);

    //结果去重
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            if (arr[i] == arr[j])
                arr.splice[i, 1];
        }
    }
    console.log("本次结果去重有：%s个", arr.length);

    //获取详细信息
    for (var i = 0; i < arr.length; i++) {
        autoSleep(count);
        count++;
        console.log("获取详细信息：%s/%s", i+1, arr.length)
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

    var columns = [];
    for (var key in arr[0]) {
        columns.push({ header: key, key: key });
    };

    sheet.columns = columns;

    for (var i = 0; i < arr.length; i++) {
        sheet.addRow(arr[i]);
    }

    //sheet.addRow([3, 'Sam', new Date()]);

    workbook.xlsx.writeFile('./' + name + '.xlsx')
        .then(function () {
            // done
        });

}
