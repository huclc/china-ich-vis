#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
微博「中国非物质文化遗产」博文爬取 + NLP 分析 (PC 搜索页解析版)
=============================================================
运行方式:
    python scrape_weibo.py

输出 (data/ 目录):
    weibo_posts.json      原始博文数据
    weibo_wordfreq.json   高频词 TOP 200
    weibo_sentiment.json  情感分布统计
    weibo_wordcloud.png   词云图
    weibo_analysis.json   前端汇总
"""

import requests
import json
import time
import re
import os
import sys
from collections import Counter
from pathlib import Path
from html import unescape

# ============================================================
# 配置
# ============================================================
COOKIES = {
    "SCF": "AhxljtEc3w42eq4HoIhL5mO8gftbQmkuUrud0hpIVfmJnfRX5utwZyxmaEIADMTq6o0tfuwt6DtlLuRj2cGG-HY.",
    "SUB": "_2A25HJJuzDeRhGeFH41AT8SzLzz6IHXVkW5F7rDV8PUJbkNAYLU3skW1NekbgsoBVeHjqUBqMwgvrYTUM23cAwb7O",
    "SUBP": "0033WrSXqPxfM725Ws9jqgMF55529P9D9WFQa6BeT1gfWIdr3x.5Bo9Y5JpX5KMhUgL.FoM41hzEeKzNShz2dJLoIp7LxKML1KBLBKnLxKqL1hnLBoMN1KnEeo2ES0BE",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Referer": "https://s.weibo.com/",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

SEARCH_KEYWORD = "中国非物质文化遗产"
TARGET_POSTS = 1000
OUTPUT_DIR = Path(__file__).resolve().parent / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# HTML 解析工具
# ============================================================

def extract_posts_from_html(html: str) -> list[dict]:
    """从微博 PC 搜索页 HTML 中提取博文列表"""
    posts = []

    # 每一条博文在一个 card-wrap 块中，mid 是唯一标识
    # 找到所有 mid 和对应的文本块
    mids = re.findall(r'mid="(\d+)"', html)

    # 提取所有博文文本 (node-type="feed_list_content")
    text_blocks = re.findall(
        r'<p[^>]*class="txt"[^>]*node-type="feed_list_content"[^>]*>\s*(.*?)\s*</p>',
        html, re.DOTALL,
    )

    # 提取用户名 (nick-name)
    nicks = re.findall(r'nick-name="([^"]+)"', html)

    # 提取发布时间
    date_links = re.findall(r'class="from">\s*<a[^>]*>(.*?)</a>', html)

    # 提取互动数据 (转发/评论/点赞) - 每个 card-act 块包含
    card_acts = re.findall(r'class="card-act">(.*?)</div>', html, re.DOTALL)
    interactions = []
    for act in card_acts:
        # 提取转发/评论/点赞数：<em>xxx</em> 序列
        # 但不是所有 card 都有完整数据
        nums = re.findall(r'<em>(\d+)</em>', act)
        # 转发数、评论数、点赞数
        reposts = int(nums[0]) if len(nums) > 0 else 0
        comments = int(nums[1]) if len(nums) > 1 else 0
        likes = int(nums[2]) if len(nums) > 2 else 0
        interactions.append({"reposts": reposts, "comments": comments, "likes": likes})

    # 确保数量一致
    count = min(len(mids), len(text_blocks), len(nicks), len(card_acts))

    for i in range(count):
        text = text_blocks[i]
        # 清洗 HTML
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'http\S+', '', text)
        text = unescape(text)
        text = text.replace('​', '').replace('\xa0', ' ').strip()
        text = re.sub(r'\s+', '', text)

        if len(text) < 8:
            continue

        inter = interactions[i] if i < len(interactions) else {"reposts": 0, "comments": 0, "likes": 0}

        posts.append({
            "id": mids[i],
            "text": text,
            "user_name": nicks[i] if i < len(nicks) else "",
            "created_at": date_links[i] if i < len(date_links) else "",
            "reposts": inter["reposts"],
            "comments": inter["comments"],
            "likes": inter["likes"],
        })

    return posts


# ============================================================
# 第一步：爬取博文
# ============================================================
def scrape_all_posts():
    session = requests.Session()
    all_posts = []
    seen_ids = set()
    page = 1
    max_pages = 60

    while len(all_posts) < TARGET_POSTS and page <= max_pages:
        url = (
            f"https://s.weibo.com/weibo"
            f"?q={SEARCH_KEYWORD}"
            f"&typeall=1&suball=1&timescope=custom:2024-01-01:2026-06-04"
            f"&Refer=g&page={page}"
        )

        try:
            resp = session.get(url, headers=HEADERS, cookies=COOKIES, timeout=20)
            resp.encoding = "utf-8"
            html = resp.text
        except Exception as e:
            print(f"  [{page:02d}] 请求失败: {e}")
            time.sleep(3)
            page += 1
            continue

        page_posts = extract_posts_from_html(html)
        new_count = 0
        for post in page_posts:
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                all_posts.append(post)
                new_count += 1

        print(f"  [{page:02d}] 解析 {len(page_posts)} 条, 新增 {new_count} 条 (累计 {len(all_posts)})")

        if new_count == 0:
            print(f"  -> 无新数据，可能已到末页或 cookie 过期")
            break

        page += 1
        time.sleep(1.5)

    return all_posts[:TARGET_POSTS]


print("=" * 60)
print(f"Scraping: {SEARCH_KEYWORD}")
print(f"Target: {TARGET_POSTS} posts")
print("=" * 60)

all_posts = scrape_all_posts()
print(f"\nDone: {len(all_posts)} posts collected")

# 保存原始数据
posts_path = OUTPUT_DIR / "weibo_posts.json"
with open(posts_path, "w", encoding="utf-8") as f:
    json.dump(all_posts, f, ensure_ascii=False, indent=2)
print(f"Saved: {posts_path}")

if len(all_posts) < 10:
    print("WARNING: Too few posts. Cookie may have expired. Try refreshing from browser.")
    print("1. Open https://s.weibo.com/ in browser and log in")
    print("2. Press F12 -> Application -> Cookies -> copy SUB cookie value")
    print("3. Update COOKIES dict in this script")
    sys.exit(1)

# ============================================================
# 第二步：jieba 分词 + 词频统计
# ============================================================
print("\n" + "=" * 60)
print("Word segmentation & frequency...")

import jieba

custom_words = [
    "非物质文化遗产", "非遗", "传承人", "传统技艺", "传统戏剧", "传统音乐",
    "传统舞蹈", "传统美术", "传统医药", "民间文学", "曲艺", "民俗",
    "传统体育", "游艺与杂技", "国家级", "省级", "保护单位", "文化传承",
    "工匠精神", "国潮", "国风", "李子柒", "汉服", "手艺", "匠心",
    "春节", "端午节", "中秋节", "二十四节气", "申遗", "UNESCO",
    "人类非遗", "代表作名录", "急需保护", "文化自信", "传统文化",
]
for w in custom_words:
    jieba.add_word(w)

stopwords = set("""
的 了 在 是 我 有 和 就 不 人 都 一 一个 上 也 很 到 说 要 去 你
会 着 没有 看 好 自己 这 他 她 它 们 那 些 什么 而 为 所以 因为
但是 可以 这个 如果 虽然 而且 还是 只是 然后 已经 可以 应该
没有 知道 觉得 不能 出来 起来 时候 怎么 为什么 这样 那样
真的 太 非常 比较 最 更 越 还 又 再 才 就 能 会 需要
今天 明天 昨天 现在 以后 以前 时间 年 月 日 视频 网页 链接 全文
展开 收起 转发 微博 评论 赞 回复 来自 分享 图片 查看
""".split())

all_text = " ".join(p["text"] for p in all_posts)
words = [w.strip() for w in jieba.cut(all_text) if len(w.strip()) >= 2 and w.strip() not in stopwords]
word_freq = Counter(words).most_common(200)

freq_path = OUTPUT_DIR / "weibo_wordfreq.json"
with open(freq_path, "w", encoding="utf-8") as f:
    json.dump([{"name": w, "value": c} for w, c in word_freq], f, ensure_ascii=False, indent=2)
print(f"Saved: {freq_path}")
print(f"TOP 20: {', '.join(f'{w}({c})' for w, c in word_freq[:20])}")

# ============================================================
# 第三步：SnowNLP 情感分析
# ============================================================
print("\n" + "=" * 60)
print("Sentiment analysis...")

from snownlp import SnowNLP

sentiments = []
pos_count = neu_count = neg_count = 0

for post in all_posts:
    try:
        score = SnowNLP(post["text"]).sentiments
    except:
        score = 0.5
    post["sentiment"] = round(score, 4)
    sentiments.append(score)

    if score > 0.6:
        pos_count += 1
    elif score < 0.4:
        neg_count += 1
    else:
        neu_count += 1

with open(posts_path, "w", encoding="utf-8") as f:
    json.dump(all_posts, f, ensure_ascii=False, indent=2)

sentiment_stats = {
    "total": len(all_posts),
    "positive": pos_count,
    "neutral": neu_count,
    "negative": neg_count,
    "positive_pct": round(pos_count / len(all_posts) * 100, 1),
    "neutral_pct": round(neu_count / len(all_posts) * 100, 1),
    "negative_pct": round(neg_count / len(all_posts) * 100, 1),
    "avg_score": round(sum(sentiments) / len(sentiments), 4),
}

sent_path = OUTPUT_DIR / "weibo_sentiment.json"
with open(sent_path, "w", encoding="utf-8") as f:
    json.dump(sentiment_stats, f, ensure_ascii=False, indent=2)
print(f"Saved: {sent_path}")
print(f"  Positive: {pos_count} ({sentiment_stats['positive_pct']}%)")
print(f"  Neutral:  {neu_count} ({sentiment_stats['neutral_pct']}%)")
print(f"  Negative: {neg_count} ({sentiment_stats['negative_pct']}%)")
print(f"  Avg score: {sentiment_stats['avg_score']}")

# ============================================================
# 第四步：词云图
# ============================================================
print("\n" + "=" * 60)
print("Word cloud...")

from wordcloud import WordCloud

font_path = None
for fp in [
    "C:/Windows/Fonts/msyh.ttc",
    "C:/Windows/Fonts/simhei.ttf",
    "C:/Windows/Fonts/simsun.ttc",
]:
    if os.path.exists(fp):
        font_path = fp
        break

word_freq_dict = {w: c for w, c in word_freq}

wc = WordCloud(
    font_path=font_path,
    width=1200,
    height=600,
    background_color="#f5f0e8",
    max_words=150,
    max_font_size=120,
    min_font_size=14,
    colormap="viridis",
    prefer_horizontal=0.7,
    collocations=False,
)
wc.generate_from_frequencies(word_freq_dict)

wc_path = OUTPUT_DIR / "weibo_wordcloud.png"
wc.to_file(str(wc_path))
print(f"Saved: {wc_path}")

# ============================================================
# 第五步：前端汇总
# ============================================================
print("\n" + "=" * 60)
print("Building frontend summary...")

category_keywords = {
    "传统技艺": ["传统技艺", "手艺", "手工", "匠人", "技艺", "工艺", "陶瓷", "刺绣", "剪纸", "木雕"],
    "民俗": ["民俗", "节庆", "庙会", "灯会", "龙舟", "习俗", "祭", "社火"],
    "传统戏剧": ["传统戏剧", "戏曲", "京剧", "昆曲", "豫剧", "川剧", "变脸", "皮影", "木偶"],
    "传统音乐": ["传统音乐", "民歌", "古琴", "古筝", "二胡", "唢呐", "山歌", "号子"],
    "传统舞蹈": ["传统舞蹈", "舞龙", "舞狮", "秧歌", "锅庄", "孔雀舞", "安塞腰鼓"],
    "传统美术": ["传统美术", "年画", "书法", "国画", "篆刻", "泥塑", "石雕"],
    "民间文学": ["民间文学", "传说", "故事", "史诗", "格萨尔", "玛纳斯", "江格尔"],
    "曲艺": ["曲艺", "相声", "评书", "快板", "鼓书", "弹词", "说唱"],
    "传统医药": ["传统医药", "中医", "中药", "针灸", "藏医", "蒙医", "苗医"],
    "传统体育": ["传统体育", "武术", "太极", "少林", "咏春", "赛马", "摔跤", "射箭"],
}

category_counts = {}
category_sentiment = {}
for cat, keywords in category_keywords.items():
    scores = []
    count = 0
    for post in all_posts:
        if any(kw in post["text"] for kw in keywords):
            count += 1
            scores.append(post["sentiment"])
    category_counts[cat] = count
    if scores:
        pos = sum(1 for s in scores if s > 0.6)
        neu = sum(1 for s in scores if 0.4 <= s <= 0.6)
        neg = sum(1 for s in scores if s < 0.4)
        category_sentiment[cat] = {
            "count": len(scores),
            "avg_sentiment": round(sum(scores) / len(scores), 4),
            "positive": pos, "neutral": neu, "negative": neg,
        }

analysis = {
    "meta": {
        "keyword": SEARCH_KEYWORD,
        "total_posts": len(all_posts),
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    },
    "sentiment": sentiment_stats,
    "word_freq_top50": [{"name": w, "value": c} for w, c in word_freq[:50]],
    "word_freq_top200": [{"name": w, "value": c} for w, c in word_freq],
    "category_mentions": category_counts,
    "category_sentiment": category_sentiment,
    "sample_posts": {
        "positive": [p for p in all_posts if p["sentiment"] > 0.8][:5],
        "negative": [p for p in all_posts if p["sentiment"] < 0.2][:5],
        "hot": sorted(all_posts, key=lambda x: x["likes"] + x["reposts"] + x["comments"], reverse=True)[:10],
    },
}

analysis_path = OUTPUT_DIR / "weibo_analysis.json"
with open(analysis_path, "w", encoding="utf-8") as f:
    json.dump(analysis, f, ensure_ascii=False, indent=2)
print(f"Saved: {analysis_path}")

print("\n" + "=" * 60)
print("ALL DONE!")
print(f"  {posts_path}")
print(f"  {freq_path}")
print(f"  {sent_path}")
print(f"  {wc_path}")
print(f"  {analysis_path}")
print("=" * 60)
