# Shader 模板参考

常用 Unity ShaderLab/HLSL 模板，按渲染管线和效果分类。

## 目录

- [渲染管线检测](#渲染管线检测)
- [Built-in RP 模板](#built-in-rp-模板)
- [URP 模板](#urp-模板)
- [常用效果](#常用效果)
- [属性类型速查](#属性类型速查)

---

## 渲染管线检测

| 文件/关键词 | 管线 |
|-------------|------|
| manifest.json 含 `com.unity.render-pipelines.universal` | URP |
| manifest.json 含 `com.unity.render-pipelines.high-definition` | HDRP |
| 以上皆无 | Built-in RP |

```csharp
// C# 中检测管线
if (GraphicsSettings.currentRenderPipeline != null)
    Debug.Log("SRP (URP/HDRP)");
else
    Debug.Log("Built-in RP");
```

---

## Built-in RP 模板

### Unlit Shader（纯色/纹理，无光照）

```hlsl
Shader "Custom/UnlitTemplate"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
        _Intensity ("Intensity", Range(0, 5)) = 1
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4 _Color;
            float _Intensity;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv) * _Color * _Intensity;
                return col;
            }
            ENDCG
        }
    }
}
```

### Surface Shader（PBR 光照）

```hlsl
Shader "Custom/SurfaceTemplate"
{
    Properties
    {
        _MainTex ("Albedo", 2D) = "white" {}
        _BumpMap ("Normal", 2D) = "bump" {}
        _Metallic ("Metallic", Range(0,1)) = 0
        _Smoothness ("Smoothness", Range(0,1)) = 0.5
        _EmissionMap ("Emission", 2D) = "black" {}
        [HDR] _EmissionColor ("Emission Color", Color) = (0,0,0,0)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        sampler2D _BumpMap;
        sampler2D _EmissionMap;
        half _Metallic;
        half _Smoothness;
        half4 _EmissionColor;

        struct Input
        {
            float2 uv_MainTex;
            float2 uv_BumpMap;
            float2 uv_EmissionMap;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            fixed4 albedo = tex2D(_MainTex, IN.uv_MainTex);
            o.Albedo = albedo.rgb;
            o.Normal = UnpackNormal(tex2D(_BumpMap, IN.uv_BumpMap));
            o.Metallic = _Metallic;
            o.Smoothness = _Smoothness;
            fixed4 emission = tex2D(_EmissionMap, IN.uv_EmissionMap) * _EmissionColor;
            o.Emission = emission.rgb;
            o.Alpha = albedo.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

---

## URP 模板

### URP Unlit Shader

```hlsl
Shader "Custom/URP_UnlitTemplate"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }
        LOD 100

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionHCS : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            TEXTURE2D(_MainTex);
            SAMPLER(sampler_MainTex);
            float4 _MainTex_ST;
            half4 _Color;

            Varyings vert(Attributes IN)
            {
                Varyings OUT;
                OUT.positionHCS = TransformObjectToHClip(IN.positionOS.xyz);
                OUT.uv = TRANSFORM_TEX(IN.uv, _MainTex);
                return OUT;
            }

            half4 frag(Varyings IN) : SV_Target
            {
                half4 col = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, IN.uv) * _Color;
                return col;
            }
            ENDHLSL
        }
    }
}
```

---

## 常用效果

### 溶解 (Dissolve)

```hlsl
// Properties 块添加
_DissolveTex ("Dissolve Texture", 2D) = "white" {}
_DissolveAmount ("Dissolve Amount", Range(0, 1)) = 0
_DissolveEdgeColor ("Edge Color", Color) = (1,0.5,0,1)
_DissolveEdgeWidth ("Edge Width", Range(0, 0.2)) = 0.05

// fragment 中添加
fixed dissolve = tex2D(_DissolveTex, i.uv).r;
clip(dissolve - _DissolveAmount); // 低于阈值的像素丢弃

// 边缘发光 (在 clip 之前)
half edge = smoothstep(_DissolveAmount, _DissolveAmount + _DissolveEdgeWidth, dissolve);
col.rgb = lerp(_DissolveEdgeColor.rgb, col.rgb, edge);
```

### 菲涅尔 (Fresnel)

```hlsl
// 需要法线和视线方向
float3 worldNormal = normalize(i.worldNormal);
float3 viewDir = normalize(UnityWorldSpaceViewDir(i.worldPos));
float fresnel = 1 - saturate(dot(worldNormal, viewDir));
fresnel = pow(fresnel, _FresnelPower);
col.rgb = lerp(col.rgb, _FresnelColor.rgb, fresnel * _FresnelIntensity);
```

### 顶点动画 (Vertex Animation)

```hlsl
// 在 vert 函数中，UnityObjectToClipPos 之前
float3 pos = v.vertex.xyz;
pos.y += sin(v.vertex.x * _WaveFrequency + _Time.y * _WaveSpeed) * _WaveAmplitude;
pos.x += cos(v.vertex.z * _WaveFrequency + _Time.y * _WaveSpeed) * _WaveAmplitude * 0.5;
v.vertex.xyz = pos;
```

### 脉冲发光 (Pulse Glow)

```hlsl
// 在 fragment 中
float pulse = (sin(_Time.y * _PulseSpeed) * 0.5 + 0.5) * _PulseIntensity;
col.rgb += _GlowColor.rgb * pulse;
// 或用于 Emission
o.Emission = _GlowColor.rgb * pulse;
```

### UV 流动/旋转

```hlsl
// UV 平移流动
float2 uv_scroll = i.uv + _Time.y * _ScrollSpeed * _ScrollDirection.xy;

// UV 旋转
float angle = _Time.y * _RotationSpeed;
float2 uv_rot = i.uv - 0.5;
float s = sin(angle); float c = cos(angle);
uv_rot = float2(uv_rot.x * c - uv_rot.y * s, uv_rot.x * s + uv_rot.y * c);
uv_rot += 0.5;
```

---

## 属性类型速查

| ShaderLab 类型 | C# 设置方法 | 说明 |
|---------------|-------------|------|
| `Float` / `Range` | `mat.SetFloat("_Name", val)` | 浮点值 |
| `Color` | `mat.SetColor("_Name", col)` | 颜色 (HDR 加 `[HDR]`) |
| `Vector` | `mat.SetVector("_Name", vec)` | 四维向量 |
| `2D` | `mat.SetTexture("_Name", tex)` | 2D 纹理 |
| `Int` | `mat.SetInteger("_Name", val)` / `SetInt` | 整数 |
| `[Toggle]` | `mat.SetFloat("_Name", 0/1)` | 开关 (0 或 1) |
| `[Enum(A,0,B,1)]` | `mat.SetFloat("_Name", idx)` | 枚举下拉 |
| `[KeywordEnum(A,B)]` | `mat.EnableKeyword("_NAME_A")` | Shader Keyword |
