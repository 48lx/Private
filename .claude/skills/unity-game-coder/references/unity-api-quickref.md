# Unity API 速查与最佳实践

生成代码时的 API 参考和性能准则。

## 目录

- [MonoBehaviour 生命周期](#monobehaviour-生命周期)
- [常用组件 API](#常用组件-api)
- [序列化规范](#序列化规范)
- [性能最佳实践](#性能最佳实践)
- [代码模板](#代码模板)

---

## MonoBehaviour 生命周期

```
Awake()          → 初始化自身（早于 Start）
OnEnable()       → 对象激活时
Start()          → 首帧 Update 之前（依赖其他对象初始化放这）
FixedUpdate()    → 物理更新（固定间隔，默认 0.02s）
Update()         → 每帧更新（间隔不固定）
LateUpdate()     → Update 之后（相机跟随放这）
OnDisable()      → 对象禁用时
OnDestroy()      → 销毁时
```

**原则**：
- `GetComponent` 放 `Awake`/`Start`，不要放 `Update`
- 协程：`StartCoroutine(MyCoroutine())`，用 `yield return new WaitForSeconds(t)`
- `OnValidate()` — 仅在 Editor 中，值变化时调用（适合自动设置关联引用）

---

## 常用组件 API

### Transform

```csharp
transform.position = new Vector3(0, 1, 0);
transform.localPosition;           // 相对父节点
transform.rotation = Quaternion.Euler(0, 90, 0);
transform.localScale;
transform.forward / transform.up / transform.right;
transform.Translate(Vector3.forward * speed * Time.deltaTime);
transform.LookAt(target.position);
transform.SetParent(parent, false); // false = 保持世界坐标
```

### GameObject

```csharp
gameObject.SetActive(true/false);
GameObject.Instantiate(prefab, pos, rot);
GameObject.Instantiate(prefab, parent);
Destroy(gameObject);
Destroy(gameObject, delay);        // 延迟销毁
GameObject.Find("Name");           // ❌ 性能差，避免在 Update 中使用
gameObject.GetComponent<T>();
gameObject.AddComponent<T>();
gameObject.TryGetComponent<T>(out var comp); // ✅ 比 GetComponent 安全
GameObject.FindGameObjectWithTag("Tag");     // ⚠️ 尚可，但也避免 Update 中使用
```

### Material & Renderer

```csharp
// Renderer
var rend = GetComponent<Renderer>();
rend.material.SetFloat("_Dissolve", 0.5f);  // ⚠️ 会创建材质实例，用 sharedMaterial 或 MaterialPropertyBlock

// MaterialPropertyBlock ✅ 性能更好
MaterialPropertyBlock mpb = new MaterialPropertyBlock();
rend.GetPropertyBlock(mpb);
mpb.SetFloat("_Dissolve", 0.5f);
mpb.SetColor("_Color", Color.red);
rend.SetPropertyBlock(mpb);
```

### Input (新旧两套)

```csharp
// 旧 Input Manager
if (Input.GetKey(KeyCode.W)) { }
if (Input.GetKeyDown(KeyCode.Space)) { }
if (Input.GetMouseButtonDown(0)) { }
float h = Input.GetAxis("Horizontal");
float v = Input.GetAxis("Vertical");

// 新 Input System (需要 com.unity.inputsystem 包)
using UnityEngine.InputSystem;
// 在 Inspector 中绑定 InputAction，或用 C# 事件
inputActions.Player.Move.performed += ctx => moveInput = ctx.ReadValue<Vector2>();
```

### Coroutine

```csharp
StartCoroutine(MyRoutine());
StopCoroutine(MyRoutine());
StopAllCoroutines();

IEnumerator MyRoutine()
{
    yield return new WaitForSeconds(1f);
    yield return new WaitForEndOfFrame();
    yield return new WaitUntil(() => condition);
    yield return null; // 下一帧
}
```

### Debug

```csharp
Debug.Log("消息");
Debug.LogWarning("警告");
Debug.LogError("错误");
Debug.DrawLine(posA, posB, Color.red, duration); // Scene View 中画线
Debug.DrawRay(origin, direction, Color.green);
```

---

## 序列化规范

### 推荐写法

```csharp
// ✅ 私有字段 + SerializeField — Inspector 可见，代码不可见
[SerializeField] private float speed = 5f;

// ✅ 公开属性（只读）- 其他脚本访问用
public float Speed => speed;

// ✅ Header 分组
[Header("Movement")]
[SerializeField] private float speed = 5f;
[SerializeField] private float jumpForce = 10f;

// ✅ Tooltip 提示
[Tooltip("移动速度，单位：米/秒")]
[SerializeField] private float speed = 5f;

// ✅ Range 滑块
[Range(0, 100)]
[SerializeField] private float health = 100f;

// ❌ 避免 public 字段 (不符合封装原则)
public float speed;
```

### 可序列化类型

| 可序列化 | 不可序列化 |
|----------|-----------|
| int, float, bool, string | Dictionary |
| Vector2/3/4, Quaternion | 抽象类/接口引用 |
| Color, AnimationCurve, Gradient | `object` |
| GameObject, Transform, Texture2D, Sprite | `System.Object` |
| ScriptableObject, MonoBehaviour 引用 | 多维数组 `[,]` |
| `[Serializable]` 标记的 class/struct | `static` 字段 |
| `List<T>` 和 `T[]`（可序列化 T） | properties, 方法 |

---

## 性能最佳实践

### Update 中避免

```csharp
// ❌ 每帧都做，极慢
void Update()
{
    var player = GameObject.Find("Player");           // 遍历整个场景
    var comp = GetComponent<MyComponent>();            // 内部有开销
    var obj = GameObject.FindGameObjectWithTag("Enemy"); // 遍历查找
}

// ✅ 缓存到成员变量
[SerializeField] private Transform player;
private MyComponent myComp;

void Awake()
{
    myComp = GetComponent<MyComponent>();
}

void Update()
{
    if (player == null) return;
    // 使用缓存的引用
}
```

### 通用原则

| 做法 | 原因 |
|------|------|
| 对象池替代 Instantiate/Destroy | 避免 GC 分配 |
| `TryGetComponent` 替代 `GetComponent` | 不分配 GC |
| `MaterialPropertyBlock` 替代 `material` | 避免材质实例泄漏 |
| `StringBuilder` 替代大量字符串拼接 | 减少 GC |
| `CompareTag` 替代 `tag == "xxx"` | 避免字符串分配 |
| 协程中缓存 `WaitForSeconds` | 复用，不每帧 new |
| `[SerializeField]` 引用 替代 `Find` | 编辑器绑定，零运行时开销 |

### 缓存 WaitForSeconds

```csharp
// ✅ 复用
private readonly WaitForSeconds waitOneSecond = new WaitForSeconds(1f);
IEnumerator Routine() { yield return waitOneSecond; }

// ❌ 每次 new
IEnumerator Routine() { yield return new WaitForSeconds(1f); }
```

---

## 代码模板

### MonoBehaviour 标准模板

```csharp
using UnityEngine;

namespace ProjectNamespace
{
    /// <summary>
    /// [组件用途简述]
    /// </summary>
    [RequireComponent(typeof(XXX))] // 如有依赖
    public class MyComponent : MonoBehaviour
    {
        [Header("Settings")]
        [SerializeField] private float someValue = 1f;
        [SerializeField] private Transform target;

        private XXX cachedComponent;

        private void Awake()
        {
            cachedComponent = GetComponent<XXX>();
        }

        private void Update()
        {
            // 主逻辑
        }

        /// <summary>
        /// [公开方法说明]
        /// </summary>
        public void DoSomething()
        {
            // 实现
        }
    }
}
```

### ScriptableObject 模板

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewConfig", menuName = "Project/Config")]
public class MyConfig : ScriptableObject
{
    [Header("Basic")]
    [SerializeField] private string displayName;
    [SerializeField] private Sprite icon;

    public string DisplayName => displayName;
    public Sprite Icon => icon;
}
```
