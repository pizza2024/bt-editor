# 节点属性编辑功能设计

## 1. 当前状态分析

### 已实现 ✅
- 节点基本信息显示（type, category, description）
- 节点 name/alias 的双击编辑（仅 Control/Decorator/SubTree）
- Port definitions 的定义编辑（仅自定义 Leaf 节点）
- 节点选择和高亮

### 未实现 ❌
- **Port Values 编辑** - 节点上黑色板引用的实际值（如 `{target_pose}`）
- **Decorator 参数编辑** - 如 RetryUntilSuccessful 的 `num_attempts`
- **Leaf 节点 port values** - Action/Condition 的端口值
- **SubTree 节点编辑** - 选择目标子树

### 问题
PropertiesPanel 中 port values 是 `readOnly`，提示"update via the canvas node"但实际上没有实现。

---

## 2. GRoot2 功能参考

### 节点属性编辑（GRoot2）

| 节点类型 | 可编辑属性 | 示例 |
|---------|-----------|------|
| Control | name (别名) | `<Sequence name="Root">` |
| Decorator | name, 参数 | `<RetryUntilSuccessful num_attempts="3">` |
| Leaf (Action) | port values | `<Action ID="MoveBase" goal="{target_pose}"/>` |
| Leaf (Condition) | port values | `<Condition ID="IsBatteryLow"/>` |
| SubTree | 目标树 | `<SubTree ID="DoorClosed"/>` |

### Port Values 格式
- Blackboard 引用: `{variable_name}`
- 常量值: `"fixed_value"` 或 `123`
- 表达式: `{param1} + {param2}`

---

## 3. 需要实现的功能

### 3.1 PropertiesPanel - Port Values 可编辑

```typescript
// btNode.ports 结构
{
  "goal": "{target_pose}",      // input port value
  "timeout": "1000",           // parameter value
  // ...
}
```

**编辑方式：**
- 在 PropertiesPanel 中，port values 改为可编辑 input
- 输入验证：支持 `{key}` 格式的黑色板引用
- 实时保存到 store

### 3.2 Decorator 参数编辑

Decorator 节点的 ports（如 `num_attempts`, `msec`）需要可编辑：

| Decorator | 参数 | 类型 |
|-----------|------|------|
| RetryUntilSuccessful | num_attempts | int |
| Repeat | num_cycles | int |
| Timeout | msec | int |
| Delay | delay_msec | int |
| Parallel | success_count, failure_count | int |

### 3.3 SubTree 目标选择

SubTree 节点需要：
- 下拉选择目标树
- 显示可用的树列表

### 3.4 Port Definitions（自定义节点）

自定义 Action/Condition 可以定义 ports：
- 端口名称
- 方向（input/output/inout）
- 描述

---

## 4. 实现方案

### 4.1 数据流

```
User edits in PropertiesPanel
    ↓
updateNodePorts(nodeId, ports)  // 新增 store action
    ↓
btStore: update tree → update project
    ↓
BTCanvas: sync effect → 更新节点显示
```

### 4.2 Store 变更

```typescript
// btStore.ts 新增
updateNodePorts: (treeId: string, nodeId: string, ports: Record<string, string>) => void
```

### 4.3 PropertiesPanel 变更

```tsx
// Port Values 改为可编辑
<input
  value={btNode.ports?.[p.name] ?? ''}
  onChange={(e) => handlePortChange(p.name, e.target.value)}
  placeholder="{key}"
/>
```

### 4.4 双编辑模式

| 节点类型 | name 编辑 | ports 编辑 |
|---------|----------|-----------|
| Control | ✅ 双击节点 | ❌ (无 ports) |
| Decorator | ✅ 双击节点 | ✅ PropertiesPanel |
| Leaf | ❌ (type 不可改) | ✅ PropertiesPanel |
| SubTree | ✅ 下拉选择 | ✅ (__shared_blackboard) |

---

## 5. 组件改动清单

| 文件 | 改动 |
|------|------|
| `btStore.ts` | 新增 `updateNodePorts` action |
| `PropertiesPanel.tsx` | port values 改为可编辑 |
| `PropertiesPanel.tsx` | SubTree 目标改为下拉选择 |
| `BTCanvas.tsx` | 同步 port 更新到 store |

---

## 6. 验收标准

### 功能验收

- [ ] 选择带有 ports 的节点，PropertiesPanel 显示可编辑的 port values
- [ ] 修改 port value 后，节点显示更新
- [ ] 导出 XML 包含正确的 port values
- [ ] RetryUntilSuccessful 的 num_attempts 可编辑
- [ ] SubTree 节点可选择目标树
- [ ] 编辑后切换树再切回，编辑内容保持

### 交互验收

- [ ] Port value input 支持 `{key}` 格式
- [ ] 空值显示 placeholder
- [ ] 数值类型参数只接受数字

---

## 7. 实现计划

### Phase 1: 基础 Port Values 编辑
1. btStore 新增 `updateNodePorts`
2. PropertiesPanel port values 改为可编辑
3. 保存后同步到 canvas

### Phase 2: Decorator 参数
1. PropertiesPanel 针对 Decorator 显示参数编辑
2. 数值类型参数添加输入验证

### Phase 3: SubTree 增强
1. SubTree 目标改为下拉选择
2. 显示可用树列表
