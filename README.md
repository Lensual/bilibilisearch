# bilibilisearch

用关键词组合爬B站搜索结果并获取视频 观看 收藏 硬币 等信息生成excel

---

#依赖
    * exceljs
    * unix-timestamp

# 使用方法

```
npm install exceljs unix-timestamp  #安装依赖
node ./app.js
```

# 配置

### 搜索关键词：

> app.js 中全局变量`keywords`数组
> 数组索引`0`用来表示该数组成员之间的关系
> `false`表示成员里多选一参与关键词枚举
> `true`表示所有成员必须同时参与枚举
>
> Example:
> ```
//关键词
var keywords = [
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
> ```
> `v4c` `初音中文` `初音中文曲` `初音中文原创` `初音中文翻唱` `miku中文` `miku中文曲` `miku中文原创` `miku中文翻唱` `初音未来中文` `初音未来中文曲` `初音未来中文原创` `初音未来中文翻唱` `初音ミク中文` `初音ミク中文曲` `初音ミク中文原创` `初音ミク中文翻唱` `ミク中文` `ミク中文曲` `ミク中文原创` `ミク中文翻唱`

### 屏蔽关键词：

> app.js 中全局变量`keywordsBlacklist`数组 
> 
> Example:
> ```
//屏蔽关键词
var keywordsBlacklist = [
    '中文字幕'
];
> ```

### Sleep调整：

> app.js 中全局变量`autoSleep`函数
> ```
function autoSleep(count) {
    if (!(count % 10)) {    //每10次
        sleep(500); //延迟500ms
    } else {
        sleep(100); //每次延迟100ms
    }
}
> ```

### Excel输出字段调整和过滤：
> 自行修改 app.js 中的`toXlsx`函数
> 字段参考 b站 api 返回值

#效果截图

