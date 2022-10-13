# search-vue

# 搜索框

(屎山代码，能跑就行)

### 目前支持多选类和文本类

引入index.vue，

``` html
<search :selectData="selectData" @change="change" @search="search"></search>
```

``` js
/**
 * @param {Array} selectData // 传入搜索类目数据
 * @param {Function} change // 当选项内容变化时触发的回调，返回当前搜索框选择的数据（待定）
 * @param {Function} search // 点击搜索按钮时触发，返回当前搜索框选择的数据（待定）
 */

selectData
[
  {
    title: 'cname1', // 类目名称
    code: 'code1', // 类目代码
    data: [
      {
        code: 'data_code1', // 选择数据代码
        title: 'data_name1' // 选择数据名称
      },
      { code: 'data_code2', title: 'data_name2' }
    ], // 类目分类数据
    select_type: 'select' // 数据类型，select为限定分类多选、input为自定义输入
  },
  { title: 'cname2', code: 'code2', data: [], select_type: 'input' }
]

@change
return {
  env_type: ['data_code1', 'data_code2']
}
@search
return {
  env_type: ['data_code1', 'data_code2']
}
```
