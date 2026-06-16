---
name: unity-game-coder
description: 根据自然语言描述生成 Unity C# 脚本、Shader 文件和 Editor 工具脚本。自动适配项目架构和代码风格，产出开箱即用的完整代码。当用户提到 Unity、游戏脚本、Shader、特效、编辑器工具时使用。
---

# Unity Game Coder

根据自然语言描述，分析项目架构，生成开箱即用的 Unity 完整代码（C# 脚本 + Shader + Editor 面板）。

## 工作流

```
用户描述 → 分析项目 → 澄清需求 → 生成脚本 → 生成Shader → 生成Editor → 验证
```

---

## 步骤 1: 分析 Unity 项目

### 1.1 检测项目环境

读取以下文件获取项目信息：

| 检查项 | 文件/路径 | 获取信息 |
|--------|-----------|----------|
| Unity 版本 | `ProjectSettings/ProjectVersion.txt` | m_EditorVersion |
| 包依赖 | `Packages/manifest.json` | 已安装的 Package（Input System、Addressables 等） |
| 程序集定义 | `*.asmdef` | 程序集名称、引用关系 |
| 渲染管线 | 搜索 `URP`/`HDRP`/`Built-in` 关键词 | 决定 Shader 写法 |

### 1.2 提取代码风格

打开 2-3 个现有 C# 脚本，提取：

- **命名空间**: 项目是否使用 namespace
- **命名规范**: 字段前缀（`m_` / `_` / 无）、方法命名（PascalCase）
- **架构模式**: MonoBehaviour / ScriptableObject / 自定义基类
- **注释风格**: XML 文档注释风格
- **序列化**: `[SerializeField]` / `public` 字段偏好
- **插件检测**: 是否使用 Odin Inspector (`Sirenix.OdinInspector`)

### 1.3 检查现有资源

如果任务涉及 Shader 或 Editor，先读取 1 个现有文件确认风格。

---

## 步骤 2: 澄清需求

- 需求**清晰具体** → 直接生成
- 需求**模糊** → 用 `AskUserQuestion` 追问最多 2 个问题：

```
问题: "需要确认几个关键点："
选项:
- "[方案A - 推荐的实现方式]"
- "[方案B - 替代方案]"
- "我说详细点"
```

**关键确认项**（按需选问）：
- 性能要求：移动端兼容 / 仅 PC / 无限制
- 交互方式：纯代码控制 / 需要 Inspector 调参 / 需要事件回调
- Shader 需求：纯 ShaderLab / Shader Graph 兼容 / 后处理

---

## 步骤 3: 生成 C# 脚本

### 生成原则（按优先级）

1. **匹配项目架构** — 继承项目已有的基类、使用项目已有的工具类
2. **完整的 using** — 所有引用的命名空间必须齐全
3. **XML 注释** — 公共方法和字段添加 `/// <summary>`
4. **SerializeField + private** — 需要 Inspector 暴露的字段用 `[SerializeField] private`
5. **[RequireComponent]** — 依赖其他组件时添加此特性
6. **空值检查** — `GetComponent` 等操作后检查 null
7. **性能意识** — `Update` 中避免 `GetComponent`/`Find`；使用缓存引用

### 输出格式

```
## [脚本名].cs

**用途**: [一句话说明]
**挂载位置**: [GameObject 类型和依赖]
**公开参数**: [Inspector 中可调的参数列表]

```csharp
// 完整代码
```

### 使用说明
1. 挂载到 [GameObject]
2. Inspector 中设置 [参数]
3. [运行时行为说明]
```

---

## 步骤 4: 生成 Shader（按需）

当用户描述涉及视觉效果时，生成 Shader 文件。

- 检测项目渲染管线（Built-in / URP / HDRP）
- 参考 [shader-templates.md](references/shader-templates.md) 选择模板
- 为 Shader 属性创建对应的 C# `MaterialPropertyBlock` 或 `SetFloat`/`SetColor` 调用代码

### 输出格式

```
## [Shader名].shader

**用途**: [视觉效果描述]
**属性**: [可调参数列表]
**兼容**: Built-in / URP / HDRP

```hlsl
// 完整 Shader 代码
```

### 材质参数设置 (C#)
```csharp
// 如何在脚本中控制 Shader 属性
```

---

## 步骤 5: 生成 Editor 脚本（按需）

当脚本有多个 Inspector 参数、需要自定义编辑体验时，生成 Editor 工具。

- 检测是否使用 Odin Inspector → 优先用 Odin 属性
- 参考 [editor-patterns.md](references/editor-patterns.md) 选择模式
- Editor 脚本放入 `Editor/` 文件夹

### 输出格式

```
## Editor/[脚本名]Editor.cs

**用途**: [自定义 Inspector 功能]
**依赖**: [Odin / 原生 IMGUI / UI Toolkit]
```

---

## 步骤 6: 验证

生成后做以下检查：

| 检查项 | 方法 |
|--------|------|
| using 完整性 | 确认所有类型引用了正确的命名空间 |
| API 兼容 | 确认 API 在项目的 Unity 版本中可用 |
| 命名一致性 | 与现有代码风格一致 |
| 文件夹规范 | Editor 脚本在 `Editor/` 下，Shader 在 `Shaders/` 下 |
| 依赖完整 | `[RequireComponent]` 和 `GetComponent` 类型正确 |

**报告验证结果**，发现问题自动修复。

---

## 关键原则

### 开箱即用优先

生成的代码复制到 Unity 项目后**必须能直接编译运行**。不缺 using，不缺引用，参数名正确。

### 适配优于预设

先读项目代码，再生成。不强加你不使用的架构模式。

### 一个文件能搞定就不拆

除非逻辑确实复杂（>300 行），否则保持单个脚本文件。

### 遇到不确定时

使用 `AskUserQuestion` 确认，选项控制在 2-3 个：

```
问题: "检测到项目使用 [架构A]，生成方式选择："
选项:
- "[方式1] (推荐 - 与现有代码一致)"
- "[方式2]"
```
