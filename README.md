# 高效计时器

高效计时器是一款面向陪玩接单场景的微信小程序工具，用于快速计算订单时长、应收金额、抽成金额和最终到手金额，并生成统一报单模板。

## 核心能力

- 自定义开始时间和结束时间。
- 默认单价 35 元/小时，默认抽成 3 元/小时。
- 支持 15 分钟制和分钟制两种规则。
- 自动计算实际时长、总计、抽成和到手金额。
- 支持报单模板预览。
- 一键复制标准报单模板。

## 计费规则

15 分钟制：以半小时为档位，剩余时间超过 15 分钟补半小时，不超过 15 分钟不补。

分钟制：按实际分钟数计算。

## 小程序导入

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本仓库根目录。
4. AppID 可先使用测试号或在 `project.config.json` 中替换为正式 AppID。

## 项目结构

```text
app.js
app.json
app.wxss
pages/index/index.js
pages/index/index.json
pages/index/index.wxml
pages/index/index.wxss
project.config.json
```
