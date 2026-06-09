#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
DeepSeek API 情感分析 —— 对微博博文逐条分类
运行方式: python deepseek_sentiment.py
需要: pip install requests
"""

import json
import time
import requests
from pathlib import Path

API_KEY = "sk-b4bd9d194c8849d28480b6b3ba015e11"
API_URL = "https://api.deepseek.com/v1/chat/completions"
MODEL = "deepseek-chat"

INPUT_FILE = Path(__file__).parent / "data" / "weibo_posts.json"
OUTPUT_FILE = Path(__file__).parent / "data" / "weibo_posts_deepseek.json"

# 批量处理：每批 10 条，减少 API 调用次数
BATCH_SIZE = 10


def analyze_batch(posts_batch: list[dict]) -> list[dict]:
    """用 DeepSeek 批量分析情感"""
    # 构建批量提示
    texts = []
    for i, p in enumerate(posts_batch):
        texts.append(f"[{i}] {p['text'][:200]}")  # 截断到200字，节省 token

    prompt = (
        "你是一个中文情感分析专家。请对以下微博博文逐一判断情感倾向。\n"
        "对每条博文，只输出一行 JSON，格式为: {\"idx\": 序号, \"sentiment\": \"positive|neutral|negative\", \"reason\": \"简短理由(10字内)\"}\n"
        "判断标准:\n"
        "- positive: 表达赞赏、喜爱、自豪、支持、感动等正面情绪\n"
        "- neutral: 纯信息分享、新闻报道、客观描述\n"
        "- negative: 批评、质疑、担忧、失望等负面情绪\n\n"
        "博文列表:\n" + "\n".join(texts)
    )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "你是一个精确的中文情感分析助手。只输出要求的JSON格式，不做额外解释。"},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 500,
    }

    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        data = resp.json()
        content = data["choices"][0]["message"]["content"]

        # 解析 JSON 行
        results = []
        for line in content.strip().split("\n"):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    r = json.loads(line)
                    results.append(r)
                except json.JSONDecodeError:
                    continue

        return results
    except Exception as e:
        print(f"  API error: {e}")
        return []


def main():
    print("=" * 60)
    print("DeepSeek API 情感分析")
    print(f"Model: {MODEL}  |  Batch: {BATCH_SIZE}/call")
    print("=" * 60)

    # 加载博文
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        posts = json.load(f)
    print(f"Loaded {len(posts)} posts")

    # 检查是否已有部分结果（断点续传）
    done_indices = set()
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            done_posts = json.load(f)
        for p in done_posts:
            if "deepseek_sentiment" in p:
                done_indices.add(p["id"])
        print(f"Resuming: {len(done_indices)} already analyzed")

    # 找出未分析的
    todo = [p for p in posts if p["id"] not in done_indices]
    print(f"To analyze: {len(todo)} posts")

    # 批量处理
    for batch_start in range(0, len(todo), BATCH_SIZE):
        batch = todo[batch_start : batch_start + BATCH_SIZE]
        print(f"\nBatch {batch_start // BATCH_SIZE + 1}/{(len(todo) - 1) // BATCH_SIZE + 1}: {len(batch)} posts")

        results = analyze_batch(batch)
        for r in results:
            idx = r.get("idx")
            sentiment = r.get("sentiment", "neutral")
            reason = r.get("reason", "")
            if idx is not None and idx < len(batch):
                batch[idx]["deepseek_sentiment"] = sentiment
                batch[idx]["deepseek_reason"] = reason

        # 每批次保存（防止中断丢失）
        all_done = [p for p in posts if p["id"] in done_indices or p in todo[: batch_start + BATCH_SIZE]]
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(all_done, f, ensure_ascii=False, indent=2)

        if batch_start + BATCH_SIZE < len(todo):
            time.sleep(1)  # API 频率控制

    # 统计
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        final = json.load(f)

    pos = sum(1 for p in final if p.get("deepseek_sentiment") == "positive")
    neu = sum(1 for p in final if p.get("deepseek_sentiment") == "neutral")
    neg = sum(1 for p in final if p.get("deepseek_sentiment") == "negative")
    total = len(final)

    stats = {
        "total": total,
        "positive": pos,
        "neutral": neu,
        "negative": neg,
        "positive_pct": round(pos / total * 100, 1),
        "neutral_pct": round(neu / total * 100, 1),
        "negative_pct": round(neg / total * 100, 1),
    }

    # 按类别聚合
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

    category_sentiment = {}
    for cat, kws in category_keywords.items():
        scores = []
        for p in final:
            if any(kw in p["text"] for kw in kws):
                s = p.get("deepseek_sentiment", "neutral")
                scores.append(s)
        if scores:
            category_sentiment[cat] = {
                "count": len(scores),
                "positive": sum(1 for s in scores if s == "positive"),
                "neutral": sum(1 for s in scores if s == "neutral"),
                "negative": sum(1 for s in scores if s == "negative"),
            }

    # 保存前端汇总
    analysis = {
        "meta": {"method": "DeepSeek API", "model": MODEL, "total": total},
        "sentiment": stats,
        "category_sentiment": category_sentiment,
    }
    analysis_path = Path(__file__).parent / "data" / "weibo_analysis_deepseek.json"
    with open(analysis_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)

    # 复制到 public
    import shutil
    shutil.copy(analysis_path, Path(__file__).parent / "public" / "weibo_analysis_deepseek.json")

    print("\n" + "=" * 60)
    print("DONE!")
    print(f"  Positive: {pos} ({stats['positive_pct']}%)")
    print(f"  Neutral:  {neu} ({stats['neutral_pct']}%)")
    print(f"  Negative: {neg} ({stats['negative_pct']}%)")
    print(f"  Saved: {OUTPUT_FILE}")
    print(f"  Saved: {analysis_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
