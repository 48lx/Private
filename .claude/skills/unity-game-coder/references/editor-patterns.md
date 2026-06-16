# Editor 脚本范例

Unity Editor 脚本常用模式。检测到项目使用 Odin Inspector 时优先使用 Odin 方案。

## 目录

- [检测 Editor 环境](#检测-editor-环境)
- [CustomEditor（原生）](#customeditor-原生)
- [PropertyDrawer（原生）](#propertydrawer-原生)
- [EditorWindow（原生）](#editorwindow-原生)
- [Odin Inspector 版](#odin-inspector-版)
- [常用 Editor API](#常用-editor-api)

---

## 检测 Editor 环境

```csharp
// 检查是否安装了 Odin Inspector
// 方法：搜索 .csproj 或 asmdef 中是否含 Sirenix.OdinInspector
#if ODIN_INSPECTOR
    // Odin 可用
#endif
```

---

## CustomEditor（原生）

### 基础模板

```csharp
using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(MyComponent))]
public class MyComponentEditor : Editor
{
    SerializedProperty speedProp;
    SerializedProperty targetProp;

    void OnEnable()
    {
        speedProp = serializedObject.FindProperty("speed");
        targetProp = serializedObject.FindProperty("target");
    }

    public override void OnInspectorGUI()
    {
        serializedObject.Update();

        EditorGUILayout.PropertyField(speedProp);
        EditorGUILayout.PropertyField(targetProp);

        // 自定义按钮
        if (GUILayout.Button("执行操作"))
        {
            var comp = (MyComponent)target;
            comp.DoSomething();
            EditorUtility.SetDirty(target);
        }

        // 帮助框
        EditorGUILayout.HelpBox("使用说明：拖入目标后点击执行", MessageType.Info);

        serializedObject.ApplyModifiedProperties();
    }
}
```

### 带条件显示的 Inspector

```csharp
public override void OnInspectorGUI()
{
    serializedObject.Update();

    EditorGUILayout.PropertyField(useCustomProp);
    if (useCustomProp.boolValue)
    {
        EditorGUI.indentLevel++;
        EditorGUILayout.PropertyField(customValueProp);
        EditorGUI.indentLevel--;
    }

    serializedObject.ApplyModifiedProperties();
}
```

### Scene View 交互

```csharp
[CustomEditor(typeof(MyComponent))]
public class MyComponentEditor : Editor
{
    void OnSceneGUI()
    {
        var comp = (MyComponent)target;
        Handles.color = Color.cyan;
        Handles.DrawWireArc(comp.transform.position, Vector3.up,
            Vector3.forward, 360, comp.radius);
    }
}
```

---

## PropertyDrawer（原生）

用于自定义单个字段在 Inspector 中的显示：

```csharp
using UnityEngine;
using UnityEditor;

[CustomPropertyDrawer(typeof(MyRangeAttribute))]
public class MyRangeDrawer : PropertyDrawer
{
    public override void OnGUI(Rect position, SerializedProperty property, GUIContent label)
    {
        var range = (MyRangeAttribute)attribute;
        if (property.propertyType == SerializedPropertyType.Float)
        {
            EditorGUI.Slider(position, property, range.min, range.max, label);
        }
        else
        {
            EditorGUI.PropertyField(position, property, label);
        }
    }

    public override float GetPropertyHeight(SerializedProperty property, GUIContent label)
    {
        return EditorGUIUtility.singleLineHeight;
    }
}
```

---

## EditorWindow（原生）

```csharp
using UnityEngine;
using UnityEditor;

public class MyToolWindow : EditorWindow
{
    [MenuItem("Tools/我的工具窗口")]
    public static void ShowWindow()
    {
        var window = GetWindow<MyToolWindow>("我的工具");
        window.minSize = new Vector2(300, 400);
    }

    void OnGUI()
    {
        GUILayout.Label("工具面板", EditorStyles.boldLabel);

        if (GUILayout.Button("批量操作"))
        {
            // 批量处理逻辑
            foreach (var obj in Selection.gameObjects)
            {
                // 处理每个选中的对象
            }
        }
    }
}
```

---

## Odin Inspector 版

### 用 Odin 属性替代 CustomEditor

```csharp
using Sirenix.OdinInspector;
using UnityEngine;

public class MyComponent : MonoBehaviour
{
    [Title("基本设置")]
    [SerializeField] private float speed = 5f;

    [Title("高级设置", "折叠分组")]
    [ShowIf("showAdvanced")]
    [SerializeField] private float damping = 0.5f;

    private bool showAdvanced = true;

    // Odin 按钮 —— 直接在 Inspector 中可点击
    [Button("执行操作")]
    private void DoSomething()
    {
        Debug.Log($"执行操作, speed={speed}");
    }

    // 属性分组
    [FoldoutGroup("视觉效果")]
    [SerializeField] private Color mainColor = Color.white;
    [FoldoutGroup("视觉效果")]
    [SerializeField] private float intensity = 1f;

    // 验证
    [Range(0, 10)]
    [OnValueChanged("OnSpeedChanged")]
    [SerializeField] private float acceleration;

    private void OnSpeedChanged()
    {
        // 值变化时自动回调
    }
}
```

### Odin EditorWindow

```csharp
using Sirenix.OdinInspector;
using Sirenix.OdinInspector.Editor;
using UnityEditor;

public class MyOdinWindow : OdinEditorWindow
{
    [MenuItem("Tools/Odin 工具窗口")]
    private static void OpenWindow()
    {
        GetWindow<MyOdinWindow>().Show();
    }

    [Title("批量设置")]
    [FolderPath]
    public string targetFolder;

    [Button(ButtonSizes.Large)]
    private void Execute()
    {
        // 批量逻辑
    }
}
```

---

## 常用 Editor API

| API | 用途 |
|-----|------|
| `EditorGUILayout.PropertyField(sp)` | 绘制序列化属性 |
| `EditorGUILayout.Slider(sp, min, max)` | 滑块 |
| `EditorGUILayout.ObjectField(sp, typeof(T))` | 对象拖放框 |
| `EditorGUILayout.Toggle(sp, label)` | 开关 |
| `EditorGUILayout.EnumPopup(sp, label)` | 枚举下拉 |
| `EditorGUILayout.HelpBox(msg, type)` | 提示框 |
| `EditorGUI.indentLevel` | 缩进层级 |
| `EditorUtility.SetDirty(target)` | 标记对象已修改 |
| `Undo.RecordObject(target, "操作名")` | 支持撤销 |
| `Selection.gameObjects` | 当前选中的 GameObject |
| `AssetDatabase.Refresh()` | 刷新资源数据库 |
| `GUILayout.Button("文本")` | 按钮 |
| `serializedObject.Update()` | 开始修改属性 |
| `serializedObject.ApplyModifiedProperties()` | 应用修改 |
