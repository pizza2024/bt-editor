# BT CPP Web GRoot Demo - 设计文档

## 1. 概述与目标

### 1.1 项目定位
基于 Web 的简易版 BehaviorTree 编辑器，能够：
- 可视化编辑 BT 结构（拖拽、连接、布局）
- 导出与 GRoot2 完全兼容的 XML
- 支持调试状态回放

### 1.2 与 GRoot2 XML 格式兼容定义

```
<?xml version="1.0" encoding="UTF-8"?>
<root BTCPP_format="4" main_tree_to_execute="TreeID">
  <BehaviorTree ID="TreeID">
    <!-- Control/Decorator 节点: tagName = 类型名 -->
    <Sequence name="Root">
      <!-- Leaf 节点: tagName = Action/Condition, ID = 类型名 -->
      <Action ID="MoveBase"/>
      <!-- SubTree: tagName = SubTree, ID = 目标树ID -->
      <SubTree ID="DoorClosed"/>
    </Sequence>
  </BehaviorTree>
  <TreeNodesModel>
    <!-- 自定义节点定义 -->
    <Action ID="MoveBase">
      <input_port name="goal">目标位置</input_port>
    </Action>
  </TreeNodesModel>
</root>
```

## 2. 核心问题分析

### P0-1: 多 children 节点渲染问题

**问题**：`BTFlowNode` 只渲染单个 `source` Handle，但 `Sequence`/`Fallback`/`Parallel` 等节点有多个子节点，导致所有连接线从同一点发出，视觉重叠。

**原因**：ReactFlow 默认每个节点只有一个 source handle 位置。

**解决方案**：
- 为有多 children 的节点渲染多个 source handle（每个 child 一个）
- 使用 `@dagrejs/dagre` 布局时已经知道节点宽度，可以平铺分布 handles
- 关键改动在 `BTFlowNode.tsx` 和 `treeToFlow` 函数

### P0-2: 节点编辑功能缺失

**问题**：无法编辑节点的 label/name。

**解决方案**：
- 双击节点进入编辑模式
- 使用 `nodeTypes` 中的 `onDoubleClick` 回调
- 编辑状态存储在组件内部 local state，不影响 store

### P1-1: 连接线视觉区分

**问题**：多子节点时连线重叠。

**解决方案**：
- 已有多-handle 方案可以解决
- 额外优化：使用不同颜色/透明度区分不同 child index

### P1-2: 节点创建后自动编辑

**问题**：从面板拖入节点后需要手动选中并编辑。

**解决方案**：
- 在 `BTCanvas.tsx` 的 `onDrop` 中，新节点创建后调用 `selectNode(newNode.id)`
- 属性面板已支持编辑 name

### P1-3: SubTree 拖拽创建

**问题**：无法通过拖拽快速创建 SubTree 引用。

**解决方案**：
- TreeManager 中每棵树提供 draggable item
- BTCanvas 识别 `application/bt-subtree` MIME type
- 创建时 nodeType='SubTree', name=treeId

## 3. 详细设计

### 3.1 组件改动清单

| 组件 | 改动内容 |
|------|---------|
| `BTFlowNode.tsx` | 支持多 source handles；双击编辑 label |
| `btFlow.ts` | `treeToFlow` 返回每个 node 的 handles 位置信息 |
| `btStore.ts` | 可选：添加 `editingNodeId` state |
| `BTCanvas.tsx` | onDrop 后自动选中；处理 SubTree drop |
| `TreeManager.tsx` | 每棵树添加 draggable 属性 |

### 3.2 数据流

```
btStore (project: BTProject)
    ↓ treeToFlow()
ReactFlow nodes/edges
    ↓ flowToTree()
btStore (更新 trees)
```

### 3.3 多-Handle 节点渲染方案

**BTFlowNode.tsx 改动**：

```tsx
// childrenCount > 1 时，渲染多个 source handles
{childrenCount > 1 ? (
  Array.from({ length: childrenCount }, (_, i) => (
    <Handle
      key={i}
      type="source"
      position={Position.Bottom}
      style={{
        left: `${((i + 1) / (childrenCount + 1)) * 100}%`,
        background: '#6888aa',
      }}
    />
  ))
) : (
  <Handle type="source" position={Position.Bottom} ... />
)}
```

**treeToFlow 改动**：

需要在 node data 中传递 childrenCount：

```tsx
data: {
  ...,
  childrenCount: btNode.children.length,
}
```

### 3.4 节点编辑交互方案

```tsx
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(label);

const handleDoubleClick = () => {
  setIsEditing(true);
  setEditValue(label);
};

const handleBlur = () => {
  setIsEditing(false);
  onLabelChange?.(editValue);
};
```

### 3.5 边连接逻辑

当前 `flowToTree` 使用 adjacency map 构建 tree 结构，多 handles 时需要注意：
- 同一 parent 的多个 child 按某种顺序（edge.index 或 screen position）排列
- `Position.Bottom` handles 会从上到下排列对应 children

## 4. 实现计划

### Phase 1: 多-handle 支持 (P0-1) - 优先级最高
1. 修改 `treeToFlow`，node data 添加 `childrenCount`
2. 修改 `BTFlowNode`，支持多 source handles
3. 测试 Sequence/Parallel 等多 children 节点渲染

### Phase 2: 节点编辑 (P0-2)
1. BTFlowNode 添加双击编辑功能
2. BTCanvas 处理 edit 完成回调
3. 更新 node label/name 到 btStore

### Phase 3: 体验优化 (P1)
1. SubTree 拖拽创建
2. 节点创建后自动选中
3. 连接线颜色优化

## 5. 验收标准

### 5.1 多-handle 验收
- [ ] 创建 Sequence 节点，添加 3 个子节点
- [ ] 每个子节点的连接线从不同 handle 发出
- [ ] 导出 XML 格式正确

### 5.2 节点编辑验收
- [ ] 双击 Control 节点可编辑 name
- [ ] 双击 Action/Condition 节点无效果（type 不可改）
- [ ] 编辑后 name 正确显示在节点和导出 XML 中

### 5.3 整体验收
- [ ] Sample XML 导入后图形正确显示
- [ ] 导出 XML 可被 GRoot2 正常读取
- [ ] 多树 SubTree 引用正常工作
