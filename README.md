# bilibilisearch

用关键词组合爬B站搜索结果并获取视频 观看 收藏 硬币 等信息生成excel

---

# 依赖

* exceljs
* unix-timestamp

# 使用方法

```
npm install #安装依赖
node run start
```

# 配置

### 搜索关键词：

config.js 中的`keywords`数组代表关键词

`isUnion`表示该数组成员之间的关系

`true`表示成员里多选一参与关键词枚举

`false`表示所有成员必须同时参与枚举

### 屏蔽关键词：

config.js 中的`keywordsBlacklist`数组 

Example:

```
//屏蔽关键词
keywordsBlacklist = [
    '中文字幕'
]
```

### Sleep调整：

app.js 中全局变量`autoSleep`函数

```
function autoSleep(count) {
    if (!(count % 10)) {    //每10次
        sleep(500); //延迟500ms
    } else {
        sleep(100); //每次延迟100ms
    }
}
```

### Excel输出字段调整和过滤：

自行修改 app.js 中的`toXlsx`函数

字段参考b站api返回值

# 效果截图

![1](https://github.com/Lensual/bilibilisearch/raw/master/perview/1.png)
![1](https://github.com/Lensual/bilibilisearch/raw/master/perview/2.png)
![1](https://github.com/Lensual/bilibilisearch/raw/master/perview/3.png)
