#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
关键词聚类分析 —— 基于共现矩阵的层次聚类
运行方式: python keyword_cluster.py
"""

import json
import re
import jieba
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path

INPUT_FILE = Path(__file__).parent / "data" / "weibo_posts.json"
OUTPUT_FILE = Path(__file__).parent / "data" / "weibo_cluster.json"

# ============================================================
# 1. 分词 + 清洗
# ============================================================
print("Loading posts...")
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    posts = json.load(f)
print(f"  {len(posts)} posts")

stopwords = set("""
的 了 在 是 我 有 和 就 不 人 都 一 一个 上 也 很 到 说 要 去 你
会 着 没有 看 好 自己 这 他 她 它 们 那 些 什么 而 为 所以 因为
但是 可以 这个 如果 虽然 而且 还是 只是 然后 已经 应该 没有 知道
觉得 不能 出来 起来 时候 怎么 为什么 这样 那样 真的 太 非常 比较
最 更 越 还 又 再 才 就 能 会 需要 今天 明天 昨天 现在 以后 以前
时间 年 月 日 视频 网页 链接 全文 展开 收起 转发 微博 评论 赞 回复
来自 分享 图片 查看 中国 非物质文化遗产 非遗 文化 国家级 代表性 项目
名录 保护 传承人 物质 文化遗产 遗传 超话 我们 之一 作为 足迹 家业
2026 2025 2024 2023 2022 2021 2020 20 30 10 100 200 500 1000
杨紫 推荐 计划 罗汉 助力 大使 关注 一起 参与 更多 了解 进行 通过
""".split())

custom_words = [
    "传统技艺", "传统戏剧", "传统音乐", "传统舞蹈", "传统美术", "传统医药",
    "民间文学", "曲艺", "民俗", "传统体育", "游艺与杂技", "工匠精神", "国潮",
    "国风", "李子柒", "汉服", "手艺", "匠心", "春节", "端午节", "中秋节",
    "二十四节气", "申遗", "UNESCO", "人类非遗", "代表作名录", "急需保护",
    "文化自信", "传统文化", "刺绣", "陶瓷", "剪纸", "木雕", "皮影",
    "京剧", "昆曲", "豫剧", "川剧", "变脸", "古琴", "古筝", "二胡", "唢呐",
    "舞龙", "舞狮", "秧歌", "年画", "书法", "国画", "篆刻", "泥塑", "石雕",
    "相声", "评书", "快板", "中医", "中药", "针灸", "武术", "太极", "少林",
    "龙舟", "庙会", "茶文化", "美食", "丝绸", "瓷器", "漆器", "秦腔",
]
for w in custom_words:
    jieba.add_word(w)

# 抽取关键词
print("Tokenizing...")
all_text = " ".join(p["text"] for p in posts)
words = [w.strip() for w in jieba.cut(all_text) if len(w.strip()) >= 2 and w.strip() not in stopwords]
words = [w for w in words if not re.match(r"^[\d\W_]+$", w)]
word_freq = Counter(words)
top_words = word_freq.most_common(60)
print(f"  Top 60 keywords extracted")

# ============================================================
# 2. 构建共现矩阵
# ============================================================
print("Building co-occurrence matrix...")
top_set = set(w for w, _ in top_words)
cooccur = defaultdict(int)

for post in posts:
    post_words = set()
    for w in jieba.cut(post["text"]):
        w = w.strip()
        if len(w) >= 2 and w not in stopwords and not re.match(r"^[\d\W_]+$", w) and w in top_set:
            post_words.add(w)
    for w1, w2 in combinations(sorted(post_words), 2):
        cooccur[(w1, w2)] += 1

# ============================================================
# 3. 简单层次聚类 (Agglomerative)
# ============================================================
print("Clustering...")
N_CLUSTERS = 6

# Jaccard 距离: 1 - |A∩B| / |A∪B|
# 用共现频率和各自频率计算
word_list = [w for w, _ in top_words]
n = len(word_list)
freq_dict = dict(top_words)


def similarity(w1, w2):
    """Jaccard-like similarity based on co-occurrence"""
    if w1 == w2:
        return 1.0
    pair = (min(w1, w2), max(w1, w2))
    cooc = cooccur.get(pair, 0)
    if cooc == 0:
        return 0.0
    f1, f2 = freq_dict.get(w1, 1), freq_dict.get(w2, 1)
    return cooc / (f1 + f2 - cooc)


# 初始每个词一个簇
clusters = [[w] for w in word_list]

# 合并最相似的簇（单链接），直到剩下 N_CLUSTERS 个
while len(clusters) > N_CLUSTERS:
    best_sim = -1
    best_pair = (0, 1)
    for i in range(len(clusters)):
        for j in range(i + 1, len(clusters)):
            # 单链接：两个簇之间最大的 pairwise 相似度
            max_sim = 0
            for wi in clusters[i]:
                for wj in clusters[j]:
                    s = similarity(wi, wj)
                    if s > max_sim:
                        max_sim = s
                        if max_sim > best_sim:
                            best_sim = max_sim
                            best_pair = (i, j)
    if best_sim <= 0:
        break
    i, j = best_pair
    clusters[i].extend(clusters[j])
    clusters.pop(j)

print(f"  {len(clusters)} clusters formed")

# 按簇内词频总和排序
clusters.sort(key=lambda c: sum(freq_dict.get(w, 0) for w in c), reverse=True)

# 自动命名簇（取最高频词前2个）
cluster_names = []
for cl in clusters:
    top2 = sorted(cl, key=lambda w: freq_dict.get(w, 0), reverse=True)[:2]
    cluster_names.append(" · ".join(top2))

# ============================================================
# 4. 输出
# ============================================================
result = {
    "clusters": [
        {
            "name": cluster_names[i],
            "keywords": [
                {"word": w, "freq": freq_dict.get(w, 0)}
                for w in sorted(cl, key=lambda x: freq_dict.get(x, 0), reverse=True)
            ],
        }
        for i, cl in enumerate(clusters)
    ],
    "word_freq_all": [{"name": w, "value": c} for w, c in top_words],
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

import shutil
shutil.copy(OUTPUT_FILE, Path(__file__).parent / "public" / "weibo_cluster.json")

print(f"\nClusters:")
for i, cl in enumerate(clusters):
    top5 = sorted(cl, key=lambda w: freq_dict.get(w, 0), reverse=True)[:5]
    print(f"  [{cluster_names[i]}]: {', '.join(f'{w}({freq_dict[w]})' for w in top5)}")
print(f"\nSaved: {OUTPUT_FILE}")
