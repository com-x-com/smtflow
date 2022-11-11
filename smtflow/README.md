# Smtflow

## 介绍
Smt(Smart)flow 一款纯JS的WEB前端流程图设计工具，支持拖拽设计，丰富的API，良好的用户体验。

## 界面效果
![预览图](https://gitee.com/com-x-com/smtflow/raw/master/smtflow.png)

## 演示地址
- 纯JS版 https://www.smtflow.com/demo.html
- VUE版 https://vue.smtflow.com/demo.html

## 主页
-  https://www.smtflow.com

## Wiki
-  https://gitee.com/com-x-com/smtflow/wikis/pages

## 技术支持
- QQ：1661118
- 微信：com-x-com

## 特点
-  纯JS代码，不用引用任何JS库
-  仿JQuery EasyUI风格
-  支持主流浏览器 IE9 +，Edge，Chrome，Firefox，Opera，Safari 等
-  通俗配置，丰富的API
-  更多惊喜，等你发现

## 使用方法
#### 引入JS
```
<script src="./js/smtflow.min-1.0.1.js"></script>
```
#### 引入样式和图标
```
<link rel="stylesheet" href="./themes/flow.min.css">
<link rel="stylesheet" href="./themes/icons.css">
```
#### html
```
<div id="flow" style="height: 600px;margin: 20px;"></div>
```
#### 调用JS
```
let smt = $$('#flow').flow({
    // 标题；
    title: '流程图',
    // 是否可编辑； 默认 true
    //editable: true,
    // 是否显示节点标题； 默认 true
    //showNodeTitle: true,
    // 是否显示缩略图； 默认 false
    thumbnail: true,
    // 工作区比例； 默认1 大于1工作区将产生滚动条
    areaRatio: 1.5,
    // 是否显示 Footer； 默认 true
    //showFooter: false,
    // Footer 显示内容；
    footer: '北京XXXX信息技术有限公司',
    // 连线类型； line:直线；polyline:折线 默认 line
    lineType: 'polyline',
    // 言语类型； 默认 zh-cn 根据 language 目录下对应后缀名文件配置 可自定义语言
    // language: 'en',
    // 是否显示节点盒子； 默认true
	nodebox: true,
    // 左侧工具列表； icon 根据 themes 下icons.css 对应格式名称设置
    tools: [
        {title: '时间', icon: 'time'},
        {title: '查询', icon: 'search'},
        {title: 'Offer', icon: 'offer'},
        {title: '设置', icon: 'setting'},
        {title: '短信', icon: 'sms'},
        {title: '微信', icon: 'wechat'},
        // 分割线
        {type: 'separate'},
        {title: '拆分', icon: 'split'},
        {title: '合并', icon: 'merge'}
    ],
    // --------------- 触发事件 ---------------
    // 点击新增时触发；
    onClickNew: function() {
        return confirm('确定新建?');
        //return false; 返回false 不新建工作区
    },
    // 点击打开时触发；
    onClickOpen: function() {
        console.info('onClickOpen');
        //TODO
    },
    // 点击保存时触发； 参数 当前流程图Json数据
    onClickSave: function(data) {
        console.info('onClickSave')
        //TODO
    },
    // 删除节点时触发； 参数 当前节点id，当前节点类型
    onRemoveNode: function(id, type) {
        console.info('onRemoveNode')
        //TODO
        //return false; 返回false 不删除节点
    },
    // 节点鼠标右键时点击设置触发； 参数 当前节点id，当前节点类型
    onSettingNode: function(id, type) {
        console.info('onSettingNode')
        //TODO
    },
    // 双击节点时触发； 参数 当前节点id，当前节点类型
    onDblclick: function(id, type) {
        console.info('onDblclick')
        //TODO
    },
    // 新增节点时触发；参数 当前节点类型
    onAddNode: function(type) {
        console.info('onAddNode')
        //TODO
    },
    // 增加连线时触发；参数 开始节点对象（id，type），结束节点对象（id，type）
    onAddLine: function(from, to) {
        console.info('onAddLine')
        //TODO
    },
    // 流程图加载完成时触发
    onLoadSuccess: function() {
        console.info('success');
        //TODO
    }
});

--------------- 方法 ---------------
// 设置流程图不可编辑
smt.flow('disable');

// 设置流程图可编辑
smt.flow('enable');

// 设置流程图标题
smt.flow('setTitle', '流程图');

// 设置连线类型  line:直线；polyline:折线
smt.flow('setLineType', 'line');

// 设置节点标题是否显示 true/false
smt.flow('setShowNodeTitle', true);

// 调用内部消息显示；参数 content：消息内容，time：显示时间 默认 2000 毫秒
smt.flow('setMessage', {content:"测试消息方法", time: 4000}); 

// 导入流程图数据
smt.flow('loadData', data);

// 根据id获取节点
let node = smt.flow('getNode', 'NL4C63325');

// 根据id获取连线
let node = smt.flow('getLine', 'LL4C6TX3Z');
```

## 按钮事件
### 修改连线类型
![修改连线类型](https://images.gitee.com/uploads/images/2022/0114/160528_441386aa_10219732.png "修改连线类型")
-  **注：也可通过以下代码设置连线类型**
```
// 设置连线类型  line:直线；polyline:折线
smt.flow('setLineType', 'line');
```


### 新建工作区
![新建工作区](https://images.gitee.com/uploads/images/2022/0114/160854_e6b5a33c_10219732.png "新建工作区")
-  **注：新建工作区前可在事件方法中进行其他操作**
```
// 点击新增时触发；
onClickNew: function() {
    return confirm('确定新建?');
    //return false; 返回false 不新建工作区
}
```


### 打开数据列表导入数据（由开发者自定义实现，弹出流程图数据列表后调用导入数据）
![打开数据列表导入数据](https://images.gitee.com/uploads/images/2022/0114/161319_5fc8b851_10219732.png "打开数据列表导入数据")
-  **注：代码中实现打开事件进行数据列表展示，并导入数据**
```
// 点击打开时触发；
onClickOpen: function() {
    //TODO: 打开数据列表 形式由开发者自定义；然后选择数据，通过 smt.flow('loadData', data); 实现数据导入。
}
```


### 保存流程图数据
![保存流程图数据](https://images.gitee.com/uploads/images/2022/0114/161513_afcefb43_10219732.png "保存流程图数据")
- **注：代码中可获取流程图数据，并对其进行存储及其他相关操作**
```
onClickSave: function(data) {
    //TODO: 事件返回流程图数据，后续可由开发者进行数据存储
}
```


### 返回上一步操作
![返回上一步操作](https://images.gitee.com/uploads/images/2022/0114/161630_6b33e988_10219732.png "返回上一步操作")
-  **注：流程图内部方法**


### 撤销返回
![撤销返回](https://images.gitee.com/uploads/images/2022/0114/161704_fb3afdcf_10219732.png "撤销返回")
-  **注：流程图内部方法**


### 保存流程为图片
![保存流程为图片](https://images.gitee.com/uploads/images/2022/0114/161749_67da0cbe_10219732.png "保存流程为图片")
- **注：流程图内部方法** 


## 界面事件
### 工具栏拖拽至工作区创建节点
![创建节点](https://images.gitee.com/uploads/images/2022/0114/155520_aa5d25c6_10219732.png "创建节点")
-  **注：新建节点触发相关事件**
```
// 新增节点 type:节点类型
onAddNode: function(type) {
     //TODO
}
```

### 节点上方位点拖拽至另一个节点方位点创建连线
![创建连线](https://images.gitee.com/uploads/images/2022/0114/154832_10f308bf_10219732.png "创建连线")
-  **注：新增连线触发相关事件**
```
// 增加连线 from: 开始节点对象（id，type）to: 结束节点对象（id，type）
onAddLine: function(from, to) {
    //TODO
}
```

### 节点右上角红叉删除节点同时删除节点所连线
![节点删除](https://images.gitee.com/uploads/images/2022/0114/155122_f75c3368_10219732.png "节点删除")
-  **注：删除节点触发事件**
```
// 删除节点 id: 当前节点id type: 当前节点类型
onRemoveNode: function(id, type) {
    //TODO
}
```

### 节点右键唤醒节点菜单，可删除和设置节点
![节点菜单](https://images.gitee.com/uploads/images/2022/0114/154933_4e870786_10219732.png "节点菜单")


### 选择连线时唤醒连线工具，可删除和修改连线类型
![连线工具](https://images.gitee.com/uploads/images/2022/0114/155221_dea99c95_10219732.png "连线工具")


## 属性
| 属性名 | 属性值类型 | 描述 | 默认值 |
|-----|-------|----|-----|
|title|string |流程图标题|Smtflow|
|editable|boolean|是否可编辑|true|
|showNodeTitle|boolean|是否显示节点标题|true|
|thumbnail|boolean|是否显示缩略图|false|
|areaRatio|number|工作区比例； 默认1 大于1工作区将产生滚动条|1|
|showFooter|boolean|是否显示 Footer|true|
|footer|string|Footer 显示内容|none|
|lineType|string|连线类型； line:直线；polyline:折线|line|
|language|string|言语类型； 默认 zh-cn 根据 language 目录下对应后缀名文件配置 可自定义语言|zh-cn|
|nodebox|boolean|是否显示节点盒子，当等于false时只不显示节点背景只有图标|true|
|tools|array|左侧工具列表； icon 根据 themes 下icons.css 对应格式名称设置|[]|

## 事件
| 事件名| 事件参数 | 参数描述 | 触发场景 |
|---------------|------|------|------|
|onClickNew|none|none|点击新增时触发|
|onClickOpen|none|none|点击打开时触发|
|onClickSave|data|当前流程图Json数据|点击保存时触发|
|onRemoveNode|id, type|当前节点id，当前节点类型|删除节点时触发|
|onSettingNode|id, type|当前节点id，当前节点类型|节点鼠标右键时点击设置触发|
|onDblclick|id, type|当前节点id，当前节点类型|双击节点时触发|
|onAddNode|type|当前节点类型|新增节点时触发|
|onAddLine|from, to|开始节点对象（id，type），结束节点对象（id，type）|增加连线时触发|
|onLoadSuccess|none|none|流程图加载完成时触发|

## 方法
|方法名|参数类型|描述|示例|
|-----|------|----|----|
|disable|none|设置流程图不可编辑|smt.flow('disable');|
|enable|none|设置流程图可编辑|smt.flow('enable');|
|setTitle|string|设置流程图标题|smt.flow('setTitle', '营销活动');|
|setLineType|string|设置连线类型  line:直线；polyline:折线|smt.flow('setLineType', 'line');|
|setShowNodeTitle|boolean|设置节点标题是否显示 true/false|smt.flow('setShowNodeTitle', true);|
|setMessage|map|调用内部消息显示；参数 content：消息内容，time：显示时间 默认 2000 毫秒|smt.flow('setMessage', {content:"测试消息方法", time: 4000});|
|loadData|map|导入流程图数据|smt.flow('loadData', data);|
|getNode|string|根据id获取节点|let node = smt.flow('getNode', 'NL4C63325');|
|getLine|string|根据id获取连线|let node = smt.flow('getLine', 'LL4C6TX3Z');|

## 结构数据说明
### 格式

```
{
    "id": "F1642153094692100",
    "title": "流程图",
    "lineType": "polyline",
    "editable": true,
    "showNodeTitle": true,
    "nodes": [{
            "id": "NL4C63325",
            "title": "开始",
            "x": 230.5,
            "y": 180.5,
            "type": "start"
        }, {
            "id": "NL4C6TWC6",
            "title": "结束",
            "x": 453.5,
            "y": 181.5,
            "type": "end"
        }
    ],
    "lines": [{
            "id": "LL4C6TX3Z",
            "type": "polyline",
            "from": {
                "id": "NL4C63325",
                "dot": "r",
                "x": 276.5,
                "y": 203.5
            },
            "to": {
                "id": "NL4C6TWC6",
                "dot": "l",
                "x": 453.5,
                "y": 204.5
            }
        }
    ]
}
```
### 属性
| 一级属性	|二级属性|三级属性| 描述 |
|---------------|----|----|----|
| id            |||流程图id|
| title         |||流程图标题|
| lineType      |||全局连线类型|
| editable      |||是否可编辑|
| showNodeTitle |||是否显示节点标题|
| nodes         |||节点数组|
|               |id||节点id|
|               |title||节点标题|
|               |x||横坐标|
|               |y||纵坐标|
|               |type||节点类型|
| lines         |||连线数组|
|               |id||连线id|
|               |type||连线类型|
|               |from||开始节点|
|               ||id|开始节点id|
|               ||dot|开始节点方位点|
|               ||x|连线开始节点横坐标|
|               ||y|连线开始节点纵坐标|
|               |to||结束节点|
|               ||id|结束节点id|
|               ||dot|结束节点方位点|
|               ||x|连线结束节点横坐标|
|               ||y|连线结束节点纵坐标|