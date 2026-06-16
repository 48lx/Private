# Learnings

Corrections, insights, and knowledge gaps captured during development.

**Categories**: correction | insight | knowledge_gap | best_practice

---

## [LRN-20260609-001] best_practice

**Logged**: 2026-06-09T14:43:00+08:00
**Priority**: high
**Status**: pending
**Area**: config

### Summary
Claude Code 项目级 Skill 必须放在 `.claude/skills/` 目录下，`skills/`（无点号前缀）不会被扫描识别。

### Details
之前创建的所有自定义 Skill（unity-game-coder, qiuzhi-skill-creator, self-improving-agent）都放在了项目根目录的 `skills/` 下，重启会话后全部提示 "Unknown skill"。迁移到 `.claude/skills/` 后重启即全部可用。

### Suggested Action
- 创建 Skill 时必须确认目标路径是 `.claude/skills/<skill-name>/`
- 更新 qiuzhi-skill-creator 的 SKILL.md，在 Phase 1.4 明确路径规范
- 考虑将此项 promote 到 CLAUDE.md

### Metadata
- Source: error
- Related Files: .claude/skills/*/SKILL.md
- Tags: skills, claude-code, project-setup, gotcha

---

## [LRN-20260609-002] best_practice

**Logged**: 2026-06-09T14:43:00+08:00
**Priority**: medium
**Status**: pending
**Area**: config

### Summary
Skill 的 YAML frontmatter 只能包含 `name` 和 `description` 字段，多余的 `metadata:` 空字段会导致解析失败。

### Details
self-improving-agent-3.0.23 的 SKILL.md 在 frontmatter 中有一个空的 `metadata:` 行，不属于标准 Skill spec（仅 name + description）。删除该行后问题解决。另外目录名应与 name 字段一致（去掉版本号后缀）。

### Suggested Action
- 在 qiuzhi-skill-creator 的 Phase 3.3 中强调：frontmatter 仅允许 name + description，不能有额外字段
- Skill 导入时做一次 frontmatter 校验

### Metadata
- Source: error
- Related Files: .claude/skills/self-improving-agent/SKILL.md
- Tags: skills, yaml, frontmatter, validation
