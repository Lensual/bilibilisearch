"use strict"
//搜索api
var apiUrl = 'https://search.bilibili.com/api/search?';
//查询json
var queryJson = {
    'search_type': 'video',
    'keyword': '初音ミク',
    'form_source': 'video_tag',
    'spm_id_from': '333.338.v_tag.1',
    'order': 'pubdate',
    'duration': '0',
    'tids': '30',
    'page': '1'
};


//必须关键词
var keywords = [
    false,
    'v4c',
    [
        true,
        [
            false,
            '初音','miku','初音未来','初音ミク','ミク'
        ],
        [
            false,
            '中文', '中文曲','中文原创','中文翻唱'
        ]
    ]
];
//可选关键词
//var keyword_opt = {'原创pv', 'pv付'};
//屏蔽关键词
//var keyword_bl

//生成查询任务


function x(arra,arrb){
    var arr=[true];
    for(var a=1;a<arra.length;a++){
        for(var b=1;b<arrb.length;b++){
            arr.push(arra[a]+' '+arrb[b]);
        }
    }
    return arr;
}

//返回有效数据从1开始的关键词数组
function mix(keywords){

    var arr = [""];
    if (keywords[0]) {   //and
        arr.push("");
        for(var i=1;i<keywords.length;i++){
            var b;
            if(typeof(keywords[i])=='string'){
                b=keywords[i];
            }else{
                b=mix(keywords[i]);
            }
            arr = x(arr,b);
            
        }
    }else{  //or
        for(var i=1;i<keywords.length;i++){
            if(typeof(keywords[i])=='string'){
                arr.push(keywords[i]);
            }else{
                var t = mix(keywords[i]);
                for(var j=1;j<t.length;j++){
                    arr.push(t[j]);
                }
            }
        }
    }
    return arr;
}


var tasks = [];
var task = {
    'search_type': 'video',
    'keyword': '',
    'form_source': 'video_tag',
    'spm_id_from': '333.338.v_tag.1',
    'order': 'pubdate',
    'duration': '0',
    'tids': '30',
    'page': '1'
};

var k = mix(keywords);
for(var i=1;i<k.length;i++){
    var t = JSON.parse(JSON.stringify(task));;
    t.keyword=k[i];
    tasks.push(t);
}
console.log("本次搜索关键词有：%s个", tasks.length);

//查询开始
function query(task,callback) {
    const https = require('https');
    const querystring = require('querystring');

    var resCollection;
    var reqUrl = apiUrl + querystring.stringify(task);

    https.get(reqUrl, (res) => {
        //console.log('状态码：', res.statusCode);
        //console.log('请求头：', res.headers);

        var rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                callback(parsedData);
                //console.log(parsedData);
                //toXlsx(parsedData);
            } catch (e) {
                console.error(e.message);
            }
        });

    }).on('error', (e) => {
        console.error(e);
    });
}

for (var i = 0; i < tasks.length; i++) {
    query(tasks[i], querycallback);
}

var results = [];
function querycallback(result) {
    results.push(result);
    if (results.length < tasks.length)
        return;

    var arr = [];
    for (var i = 0; i < results.length; i++) {
        arr = arr.concat(results[i].result);
    }

    console.log("本次结果汇总有：%s个", arr.length);

    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length; j++) {
            if( arr[i] == arr[j])
                arr.splice[i, 1];
        }
    }

    console.log("本次结果去重有：%s个",arr.length);

    toXlsx(arr)
}

function toXlsx(arr){
    var Excel = require('exceljs');
    var workbook = new Excel.Workbook();
    var sheet = workbook.addWorksheet('My Sheet');
    
    var columns = [];
    for (var key in arr[0]){
        columns.push({header:key,key:key});
    };

    sheet.columns = columns;
    
    for (var i = 0; i < arr.length;i++){
        sheet.addRow(arr[i]);
    }
    
    //sheet.addRow([3, 'Sam', new Date()]);
    
    workbook.xlsx.writeFile('./test.xlsx')
    .then(function() {
        // done
    });
    
}
