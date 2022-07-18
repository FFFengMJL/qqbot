# qqbot

- [qqbot](#qqbot)
  - [这是什么](#这是什么)
    - [功能&命令](#功能命令)
  - [环境需求](#环境需求)
    - [安装相关依赖](#安装相关依赖)
  - [运行代码](#运行代码)
  - [目录结构](#目录结构)
    - [主要代码文件夹 `plugin`](#主要代码文件夹-plugin)
    - [数据库文件夹 `prisma`](#数据库文件夹-prisma)

## 这是什么

一个使用搭配 [go-cqhttp](https://github.com/Mrs4s/go-cqhttp) 框架的个人使用的 qq 机器人后端。

使用 [express](http://expressjs.com/) 后端框架；[prisma](https://www.prisma.io/) 作为数据库 ORM，使用其生成的 sqlite 作为数据库；[TypeScript](https://www.typescriptlang.org/) 作为主要编写语言。

### 功能&命令

## 环境需求

目前使用：

1. 系统：ubuntu 20.04 arm64，其他平台暂未测试
2. node：v16.14.0
3. npm：8.13.2
4. nodemon（可选）：2.0.15
5. python3：3.8.10
6. wordcloud：1.8.2.2
7. 其他 npm 包请参考 `package.json`

### 安装相关依赖

1. 安装 nodemon（可选）：`npm i -g nodemon`（可能需要 `sudo`）
2. 安装 wordcloud：`pip install wordcloud` 或者 `pip3 install wordcloud`（都可能需要 `sudo`）
3. 安装其他依赖：`npm i`
4. 生成数据库：`npx prisma migrate dev --name init`

## 运行代码

根据 `plugin/src/main_example.ts` 和 `plugin/src/pixiv_filter_example.ts` 这两个文件分别创建对应的 `plugin/src/main.ts` 和 `plugin/src/pixiv_filter.ts` 两个文件，分别是主要程序入口和用于对 pixiv 日榜图进行筛选的过滤器

默认服务地址为 `127.0.0.1:6700`，对应的 go-cqhttp 地址为 `127.0.0.1:5700`，如果有修改的需要，请分别修改 `plugin/src/main.ts` 和 `plugin/src/http/http.ts`

如果只是直接使用，则可以直接运行如下命令：

```bash
npm run start
```

如果需要将日志写入对应的文件，可以参考下面的命令或者使用 `tee` 命令

```bash
npm run start >> ./bot.log 2>> ./bot-error.log
```

如果需要进行开发或者热重载，则需要安装 nodemon（在 windows 下可能不能使用），并运行如下命令：

```bash
npm run dev
```

## 目录结构

### 主要代码文件夹 `plugin`

```bash
./plugin
├── dist           // tsc 编译生成的文件夹，node 将会运行该文件夹中的 main.js
│   ├── xxxx
│   └── wordCloud
├── file
│   └── wordCloud    // 与词云相关的文件夹
│       ├── font     // 使用 python 生成词云所需要的字体，配置可以在 `plugin/src/wordCloud` 中的相关文件进行修改
│       └── image    // 生成的 pixiv 日榜 tag 的词云图片
└── src              // 代码文件夹
    ├── clock        // 报时功能代码
    ├── http         // 与 go-cqhttp 框架进行通信的相关函数
    ├── new          // 对国服 FF14 官网新闻进行爬取的功能
    ├── pixiv        // 对 pixiv.net 日榜进行爬取的功能
    │   ├── pixivic  // 一个 pixiv 的镜像网站（pixivic.com），不需要梯子，目前功能已弃用
    │   └── rsshub   // 通过 rsshub 进行 pixiv 相关的爬取
    ├── price        // 查询国服 FF14 的游戏内物价的功能
    ├── spyder       // 使用前面的功能进行一次具体的爬取以及设置定期爬取的功能
    ├── utils        // 无关代码
    └── wordCloud    // 词云功能，包含 python 代码
```

### 数据库文件夹 `prisma`

```bash
./prisma
├── dev.db                    // 实际使用 sqlite 数据库
├── migrations                // 命令自动生成的文件夹
│   └── migration_lock.toml
└── schema.prisma             // prisma 数据库声明文件
```
