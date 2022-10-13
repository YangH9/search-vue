<template>
  <div id="app">
    <search :selectData="selectData" />
  </div>
</template>

<script>
import search from "./components/search.vue";

export default {
  name: "App",
  components: {
    search,
  },
  data() {
    return {
      selectData: [
        {
          title: "title1", // 类目名称
          code: "code1", // 类目代码
          data: [
            {
              code: "data_code1", // 选择数据代码
              title: "data_title1", // 选择数据名称
            },
            { code: "data_code2", title: "data_title2" },
          ], // 类目分类数据
          select_type: "select", // 数据类型，select为限定分类多选、input为自定义输入
        },
        { title: "title2", code: "code2", data: [], select_type: "input" },
      ],
    };
  },
};
</script>

<style>
</style>
