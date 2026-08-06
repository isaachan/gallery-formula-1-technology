---
name: seeit
description: >
  看一眼。输入一个名词/名字（人、车、建筑、动物、物品等），
  自动从 Wikimedia Commons 搜索并下载 1-2 张照片，优先 free license（Public Domain / CC-BY）。
  触发词：看看长什么样、seeit、找照片、看图、什么样子、照片、长啥样。
---

# SeeIt — 看一眼

看书看文档遇到陌生的人名、地名、车型、建筑、动植物等，想立刻看到它的样子。

## 工作方式

1. 运行 `scripts/find_images.py`，参数是用户给的名词/名字
2. 脚本从 **Wikimedia Commons** 搜索匹配图片（全量 free-license）
3. 按 license 友好度排序（Public Domain → CC-BY → CC-BY-SA → 其他）
4. 下载 1-2 张缩略图（宽 1280px，足够看清）
5. 自动用 macOS `open` 打开图片
6. 输出每张图的 license、作者、来源链接

## 网络约束（重要）

当前网络环境下：

- `commons.wikimedia.org` ✅ 可用
- `upload.wikimedia.org` ✅ 可用（图片下载）
- `*.wikipedia.org` ❌ DNS 污染，不可用

**只走 Wikimedia Commons**，不要尝试 Wikipedia API。

如果 Commons 搜索无结果，可尝试：
- 加引号精确搜索（脚本已内置 fallback）
- 换英文/中文名再试
- 用 WebFetch 工具通过 opencode 代理访问其他图片源（最后手段）

## 使用方法

```bash
# 基本用法：下载 2 张图，自动打开
python3 /Users/kai.han/workspace/.agents/skills/seeit/scripts/find_images.py "Albert Einstein"

# 只要 1 张
python3 .../find_images.py "保时捷911" -n 1

# 指定输出目录
python3 .../find_images.py "Brandenburg Gate" -o ~/Pictures/seeit

# 不自动打开
python3 .../find_images.py "大熊猫" --no-open

# 显示更多候选
python3 .../find_images.py "Tesla Model 3" -v
```

### 参数

| 参数 | 默认 | 说明 |
|------|------|------|
| `term` | （必填）| 要查的名词/名字 |
| `-n` | 2 | 下载数量 |
| `-o` | `/tmp/seeit` | 输出目录，图片存到 `{output}/{term}/` |
| `--no-open` | — | 不自动打开 |
| `-v` | — | 显示搜索到的全部候选 |

## 输出

```
/tmp/seeit/{term}/
├── {term}_1.jpg          # 图片
├── {term}_2.jpg
└── {term}_meta.json      # license / 作者 / 来源链接
```

图片存在 `/tmp`，重启后自动清除。如需保留，用 `-o` 指定其他目录。

## 执行要求

- 用户说"看看 XX 长什么样""找张 XX 的照片""seeit XX"时激活
- 直接运行脚本，不需要反复确认
- 中英文名词都支持
- 下载后把 license 和来源简要告诉用户
- 如果没搜到，尝试中英文互换后再报告失败
