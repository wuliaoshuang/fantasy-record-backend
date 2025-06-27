## **一、概述 (General Information)**

本文档定义了“幻想记录” Web 应用的后端 API 接口。所有接口都应遵循 RESTful 设计原则。

- **根URL (Base URL):** `https://api.fantasy-record.app/v1`
    
- **数据格式 (Data Format):** 所有请求和响应的主体均为 `application/json` 格式。
    
- **认证 (Authentication):** 所有需要用户身份认证的接口，都必须在 HTTP 请求头中包含 `Authorization` 字段。令牌采用 `Bearer Token` 方案。
    
    - `Authorization: Bearer <YOUR_JWT_TOKEN>`
        
- **统一响应格式 (Standard Response Format):**
    
    - **成功响应 (Success):**
        
        JSON
        
        ```json
        {
          "success": true,
          "data": { ... } // 或 [ ... ]
        }
        ```
        
    - **失败响应 (Error):**
        
        JSON
        
        ```json
        {
          "success": false,
          "error": {
            "code": "ERROR_CODE",
            "message": "A human-readable error message."
          }
        }
        ```
        

## **二、数据模型 (Data Models)**

#### `FantasyRecord` (幻想记录)

|字段名|类型|描述|
|---|---|---|
|`id`|String|唯一标识符 (UUID)|
|`title`|String|记录的标题|
|`content`|String|富文本格式的记录内容 (e.g., Markdown or JSON-based)|
|`snippet`|String|自动生成的内容摘要，用于卡片展示|
|`tags`|Array[String]|标签列表，例如: `["软件灵感", "科幻"]`|
|`mood`|String|记录时的心情，例如: `"兴奋"`, `"沉思"`|
|`attachments`|Array[Object]|附件列表，每个对象包含 `url`, `fileName`, `fileType`|
|`userId`|String|所属用户的ID|
|`createdAt`|DateTime (ISO 8601)|创建时间|
|`updatedAt`|DateTime (ISO 8601)|最后更新时间|

#### `User` (用户)

|字段名|类型|描述|
|---|---|---|
|`id`|String|唯一标识符 (UUID)|
|`username`|String|用户名|
|`email`|String|电子邮箱|
|`settings`|Object|用户设置|
|`createdAt`|DateTime (ISO 8601)|注册时间|

---

## **三、认证接口 (Authentication API)**

### 1. 用户注册 (Sign Up)

- **Endpoint:** `POST /auth/register`
    
- **描述:** 创建一个新用户账户。
    
- **请求体 (Request Body):**
    
    JSON
    
    ```json
    {
      "username": "fantasy_user",
      "email": "user@example.com",
      "password": "a_strong_password"
    }
    ```
    
- **成功响应 (201 Created):**
    
    JSON
    
    ```json
    {
      "success": true,
      "data": {
        "token": "generated_jwt_token",
        "user": {
          "id": "user_uuid_123",
          "username": "fantasy_user",
          "email": "user@example.com"
        }
      }
    }
    ```
    

### 2. 用户登录 (Login)

- **Endpoint:** `POST /auth/login`
    
- **描述:** 用户使用邮箱和密码登录，获取认证 Token。
    
- **请求体 (Request Body):**
    
    JSON
    
    ```json
    {
      "email": "user@example.com",
      "password": "a_strong_password"
    }
    ```
    
- **成功响应 (200 OK):**
    
    JSON
    
    ```json
    {
      "success": true,
      "data": {
        "token": "generated_jwt_token",
        "user": {
          "id": "user_uuid_123",
          "username": "fantasy_user",
          "email": "user@example.com"
        }
      }
    }
    ```
    

---

## **四、幻想记录接口 (Fantasy Record API)**

### 1. 创建一条新的幻想记录

- **Endpoint:** `POST /records`
    
- **认证:** `必需`
    
- **描述:** 对应“创建/编辑幻想记录”页面的功能，用于提交一条全新的幻想。
    
- **请求体 (Request Body):**
    
    JSON
    
    ```json
    {
      "title": "关于一个时间旅行社交应用的构想",
      "content": "<h1>核心概念</h1><p>用户可以给未来的自己发送消息...</p>",
      "tags": ["软件灵感", "科幻", "社交"],
      "mood": "充满希望", // 对应 MoodSelector 的 value
      "attachments": [
        { "url": "/uploads/sketch-v1.png", "fileName": "sketch-v1.png", "fileType": "image/png" }
      ]
    }
    ```
    
- **成功响应 (201 Created):** 返回创建成功的完整 `FantasyRecord` 对象。
    

### 2. 获取所有幻想记录 (幻想流)

- **Endpoint:** `GET /records`
    
- **认证:** `必需`
    
- **描述:** 对应主仪表盘的“幻想流”，获取当前用户的所有记录，支持搜索、过滤和分页。
    
- **查询参数 (Query Parameters):**
    
    - `q` (String): 关键词搜索，匹配标题和内容。
        
    - `tag` (String): 按单个标签过滤。
        
    - `limit` (Number, default: 20): 每页数量。
        
    - `page` (Number, default: 1): 当前页码。
        
    - `sortBy` (String, default: 'createdAt'): 排序字段。
        
    - `order` (String, default: 'desc'): 排序方式 (`asc` 或 `desc`)。
        
- **成功响应 (200 OK):**
    
    JSON
    
    ```json
    {
        "success": true,
        "data": {
            "records": [
                // FantasyRecord 对象列表 (不含完整 content，只含 snippet)
                {
                    "id": "record_uuid_456",
                    "title": "关于一个时间旅行社交应用的构想",
                    "snippet": "核心概念：用户可以给未来的自己发送消息...", // maxLength: 120
                    "tags": ["软件灵感", "科幻", "社交"],
                    "mood": "充满希望",
                    "createdAt": "2025-06-27T10:30:00Z"
                }
            ],
            "pagination": {
                "totalRecords": 1,
                "currentPage": 1,
                "totalPages": 1
            }
        }
    }
    ```
    

### 3. 获取单条幻想记录详情

- **Endpoint:** `GET /records/{id}`
    
- **认证:** `必需`
    
- **描述:** 当用户点击卡片进入编辑或查看详情时调用。
    
- **成功响应 (200 OK):** 返回指定 `id` 的完整 `FantasyRecord` 对象。
    

### 4. 更新一条幻想记录

- **Endpoint:** `PUT /records/{id}`
    
- **认证:** `必需`
    
- **描述:** 在编辑页面进行修改，支持自动保存。
    
- **请求体 (Request Body):** 包含需要更新字段的 `FantasyRecord` 对象。
    
    JSON
    
    ```json
    {
      "title": "更新后的标题",
      "content": "<p>更新后的内容...</p>"
    }
    ```
    
- **成功响应 (200 OK):** 返回更新后的完整 `FantasyRecord` 对象。
    

### 5. 删除一条幻想记录

- **Endpoint:** `DELETE /records/{id}`
    
- **认证:** `必需`
    
- **成功响应 (204 No Content):** 无响应体，表示删除成功。
    

---

## **五、AI 分析接口 (AI Analysis API)**

### 1. 获取心理状态分析报告

- **Endpoint:** `GET /ai/mental-state-analysis`
    
- **认证:** `必需`
    
- **描述:** 获取“心理状态分析”标签页的全部数据。
    
- **查询参数 (Query Parameters):**
    
    - `period` (String, default: '30d'): 时间范围，例如 '7d', '30d', '90d'。
        
- **成功响应 (200 OK):**
    
    JSON
    
    ```json
    {
      "success": true,
      "data": {
        "emotionChartData": {
          "labels": ["06-01", "06-02", ...], // 日期
          "datasets": [
            {
              "label": "情绪波动",
              "data": [5, 3, 4, ...], // 情绪可以用数值映射，例如 兴奋=5, 沉思=4
              "borderColor": "#4A90E2"
            }
          ]
        },
        "themeWordCloud": [
          { "text": "项目", "value": 64 },
          { "text": "焦虑", "value": 45 },
          { "text": "灵感", "value": 32 }
        ],
        "summaryReport": "AI生成的自然语言报告，总结近期的情绪模式、主题关联性..."
      }
    }
    ```
    

### 2. 请求软件创意可行性分析

- **Endpoint:** `POST /ai/feasibility-analysis`
    
- **认证:** `必需`
    
- **描述:** 当用户在“软件创意可行性分析”页选择一条记录并点击分析按钮时调用。
    
- **请求体 (Request Body):**
    
    JSON
    
    ```json
    {
      "recordId": "record_uuid_456" // 必须是带有 '软件灵感' 标签的记录ID
    }
    ```
    
- **成功响应 (200 OK):** 返回完整的可行性分析报告。
    
    JSON
    
    ```json
    {
      "success": true,
      "data": {
        "recordTitle": "关于一个时间旅行社交应用的构想",
        "analysisDate": "2025-06-27T11:00:00Z",
        "coreUserPainPoint": "AI从幻想描述中提炼出的问题。例如：人们渴望与未来的自己建立联系，进行反思和规划。",
        "targetUserPersona": "AI推测的潜在用户群体。例如：20-35岁的年轻人，对个人成长和新科技有浓厚兴趣。",
        "coreFunctionModules": [
          "定时消息模块",
          "多媒体附件支持",
          "未来回信提醒",
          "数据加密与隐私保护"
        ],
        "marketFeasibilityScore": 85,
        "marketFeasibilityReason": "市场上缺少同类产品，概念新颖，具有病毒式传播潜力。",
        "technicalChallenges": "需要高可靠性的长期数据存储方案；时间消息的投递需要精确的任务调度系统。",
        "suggestedNextStep": "建议进行小范围的用户调研以验证核心痛点，然后可以从开发一个最小可行产品（MVP）开始，仅包含核心的定时消息功能。"
      }
    }
    ```
    

---

## **六、辅助接口 (Utility API)**

### 1. 获取所有标签

- **Endpoint:** `GET /tags`
    
- **认证:** `必需`
    
- **描述:** 用于在过滤区域（如`FilterChips`）动态展示用户已经使用过的所有标签。
    
- **成功响应 (200 OK):**
    
    JSON
    
    ```json
    {
      "success": true,
      "data": [
        "软件灵感",
        "故事片段",
        "未来设想",
        "情绪宣泄",
        "科幻",
        "社交"
      ]
    }
    ```
    

### 2. 上传附件

- **Endpoint:** `POST /attachments/upload`
    
- **认证:** `必需`
    
- **描述:** 用于上传文件（草图、灵感图等）。请求应使用 `multipart/form-data`。
    
- **成功响应 (200 OK):**
    
    JSON
    
    ```json
    {
      "success": true,
      "data": {
        "url": "/uploads/unique-file-name.png",
        "fileName": "original-filename.png",
        "fileType": "image/png"
      }
    }
    ```

### 3. **本周情绪趋势**

此接口专门为“本周情绪趋势”折线图提供数据。

- 功能描述 (Description):
    
    获取用户在指定时间周期内的每日平均心情分数，用于绘制情绪波动图。
    
- 接口地址 (Endpoint):
    
    GET /analytics/mood-trend
    
- 认证 (Authentication):
    
    必需 (Required)
    
- **请求参数 (Query Parameters):**
    

|参数名|类型|是否必需|默认值|描述|
|---|---|---|---|---|
|`period`|String|否|`weekly`|时间周期。可选值为 `weekly` (近7天) 或 `monthly` (近30天)。|

- **成功响应 (200 OK):**
    

JSON

```json
{
  "success": true,
  "data": {
    "labels": ["周六", "周日", "周一", "周二", "周三", "周四", "周五"],
    "dataPoints": [7, 8, 8, 9, 6, 7, 9]
  }
}
```

- **响应体说明 (Response Body Description):**
    
    - labels (Array\[String\]):
        
        一个包含周期内每一天标签的字符串数组。例如，对于 weekly 周期，它将包含从六天前到今天的星期标签。
        
    - dataPoints (Array\[Number]\):
        
        一个数字数组，每个数字对应 labels 中同一位置日期的平均心情分数 (mood.score)。如果某一天没有记录，该位置可以返回 null 或前一天的值，具体策略由后端决定。
        

---

### **4. 本月统计**

此接口专门为“本月统计”信息卡片提供数据。

- 功能描述 (Description):
    
    获取用户在指定时间周期内的记录统计信息，包括总数、特定标签计数和平均心情。
    
- 接口地址 (Endpoint):
    
    GET /analytics/records-summary
    
- 认证 (Authentication):
    
    必需 (Required)
    
- **请求参数 (Query Parameters):**
    

|参数名|类型|是否必需|默认值|描述|
|---|---|---|---|---|
|`period`|String|否|`monthly`|时间周期。当前仅支持 `monthly` (本日历月)。|

- **成功响应 (200 OK):**
    

JSON

```json
{
  "success": true,
  "data": {
    "totalRecords": 23,
    "softwareIdeasCount": 8,
    "storyFragmentsCount": 12,
    "averageMoodScore": 7.2
  }
}
```

- **响应体说明 (Response Body Description):**
    
    - totalRecords (Number):
        
        周期内的幻想记录总数。
        
    - softwareIdeasCount (Number):
        
        周期内，标签包含“软件灵感”的记录数量。
        
    - storyFragmentsCount (Number):
        
        周期内，标签包含“故事片段”的记录数量。
        
    - averageMoodScore (Number):
        
        周期内所有记录的 mood.score 的算术平均值，结果保留一位小数。