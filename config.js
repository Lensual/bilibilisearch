var config = {
    keywords: [
        '食物语', "恋与制作人"
    ], // 搜索关键字
    keywordsBlacklist: [
    ], // 屏蔽的关键词
    tids: '', // '' for all
    isUnion: false, //是否取并集，false代表取交集
    filePath: './bilibiliSearch.xlsx', //存文件的路径
    page: 50
}

module.exports = config