#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
from wordcloud import WordCloud


def main():
    outputFilePath = sys.argv[1]  # 输出的文件路径
    fontPath = sys.argv[2]  # 输出的文件名
    text = sys.argv[3]  # 生成词云的数据
    wc = WordCloud(background_color='grey', width=1000,
                   height=1000, font_path=fontPath, margin=5)
    wc.generate(text)  # 生成词云数据
    wc.to_image().save(outputFilePath)  # 输出到文件
    print(outputFilePath)


if __name__ == '__main__':
    main()
