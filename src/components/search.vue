<template>
  <div class="my_search">
    <div
      class="search_box"
      ref="search_box"
      :class="inputOption.isFocus ? 'active' : ''"
      @click.stop="onSearchFocus"
    >
      <div class="tag_group">
        <div class="tag_item" v-for="(item, index) in tagData" :key="index">
          <search-tag
            :data="item"
            :index="index"
            :key="index"
            :isFocus="inputOption.isFocus"
            :maxWidth="inputOption.maxWidth"
            :textWidth="getTextWidth"
            :showPopoverEle="showPopoverEle"
            @focus="tagFocus"
            @submit="tagSubmit"
            @delTag="onClickDelete"
          ></search-tag>
        </div>
        <div
          ref="input_box"
          class="input_box"
          @click.stop=""
          :style="{ width: `${inputOption.width + 6}px` }"
        >
          <input
            ref="input"
            class="search_input"
            type="text"
            v-model="inputOption.value"
            :style="{ width: `${inputOption.width + 6}px` }"
            @input="onSearchInput"
            @keydown.delete="onSearchKeyDelete"
            @keydown.enter="onSearchKeyEnter"
          />
        </div>
      </div>
      <div class="tips">
        多个关键字用竖线 “|” 分隔，多个过滤标签用回车键分隔
      </div>
      <button
        v-show="tagData.length > 0"
        class="btn_del_all el-icon-circle-close"
        @click.stop="onClickDelete('all')"
      ></button>
      <button
        class="btn_search el-icon-search"
        @click.stop="onClickSearch"
      ></button>
    </div>
    <!-- 下拉框 -->
    <search-popover
      ref="popover_box"
      :popoverOption="popoverOption"
      :popoverData="popoverData"
      @clickRadio="clickPopoverRadio"
      @clickCheckbox="clickPopoverCheckbox"
      @clickSubmit="clickPopoverSubmit"
      @clickReset="clickPopoverReset"
    ></search-popover>
    <span ref="text_width" class="text_width"></span>
  </div>
</template>

<script>
import SearchTag from "./searchTag.vue";
import SearchPopover from "./searchPopover.vue";
export default {
  name: "Search",
  components: { SearchTag, SearchPopover },
  props: {
    selectData: Array,
  },
  data() {
    return {
      // 搜索框的完整数据
      selectOption: [],
      // 输入框配置关联项
      inputOption: {
        maxWidth: 0,
        value: "",
        isFocus: false,
        width: 0,
      },
      // 下拉框配置项
      popoverOption: {
        isShow: false,
        isCheckBox: false,
        isDisabled: true,
        option: [],
        top: 0,
        left: 0,
        marginLeft: 0,
      },
      // 下拉框选择数据
      popoverData: [],
      // tag标签显示项，最终筛选的数据
      tagData: [],
      // 当前操作的选项
      selectNow: {},
      // 当前显示下拉框的元素
      showPopoverEle: "all",
    };
  },
  watch: {
    tagData: {
      handler() {
        // console.log('watch-tagData', this.tagData)
        const searchData = {};
        this.tagData.map((item) => {
          searchData[item.code] = [...item.select.map((item) => item.code)];
        });
        this.$emit("change", searchData, this.tagData);
      },
      deep: true,
    },
    selectData: {
      handler(val) {
        this.selectOption = val;
        this.popoverOption.option = val;
      },
      immediate: true,
    },
  },
  created() {
    // 初始化数据
    // 渲染地址栏数据
    window.onclick = () => {
      this.onSearchBlur();
    };
  },
  mounted() {
    this.inputOption.maxWidth = this.$refs.search_box.offsetWidth;
  },
  methods: {
    // 搜索框获取焦点
    onSearchFocus() {
      this.showPopoverEle = "all";
      // console.log('onSearchFocus', this.showPopoverEle)
      if (!this.inputOption.isFocus) {
        this.inputOption.value = "";
      }
      this.$refs.input.selectionStart = this.inputOption.value.length;
      this.resetPopoverOption();
      this.setInputWidth();
      this.inputFocus();
      if (!this.inputOption.value) {
        this.showPopover();
      }
    },
    // 搜索框输入
    onSearchInput() {
      // console.log('onSearchInput')
      const value = this.inputOption.value;
      const selectOption = this.selectOption;
      const tagData = this.tagData;
      var option = [];
      const index = value.indexOf("：");
      // 截取输入内容
      // 截取冒号，
      if (index >= 0) {
        // 有冒号，匹配分类框，
        const word = value.slice(0, index);
        var selectArr = value.slice(index + 1).split("|");
        // 匹配到，则记录当前分类，进行下一步筛选，
        const selectNow = selectOption.find((item) => item.title === word);
        if (selectNow.title) {
          if (this.selectNow.title !== selectNow.title) {
            this.clickPopoverRadio(selectNow);
          }
          // 匹配后面的值，如果是select类型按照选项值匹配，相反则全部填充
          if (selectNow.select_type === "select") {
            selectArr = selectArr.map((item) =>
              selectNow.data.find((i) => i.title === item.trim())
            );
            this.$refs.popover_box.changeCheckBoxData(
              selectArr.map((item) => item?.code)
            );
          } else {
            selectArr = selectArr.map((item) => ({
              title: item.trim(),
              code: item.trim(),
            }));
          }
          this.selectNow.select = selectArr;
        }
        // 没有匹配到，暂不处理
      } else {
        // 没有冒号，匹配字符，对下拉框进行筛选，清除选择值
        option = [
          ...selectOption.filter(
            (item) =>
              item.title.includes(value) &&
              !tagData.find((i) => i.code === item.code)
          ),
        ];
        this.selectNow = {};
      }
      if (option.length > 0) {
        this.popoverOption.option = option;
        this.showPopover();
      }
      this.setInputWidth();
    },
    // 搜索框失去焦点
    onSearchBlur() {
      if (this.inputOption.isFocus) {
        // console.log('onSearchBlur')
        this.inputOption.value = "";
        this.selectNow = {};
        this.setInputWidth();
        this.inputBlur();
        this.hidePopover();
      }
    },
    // 按下删除键
    onSearchKeyDelete() {
      // console.log('onSearchKeyDelete')
      if (this.inputOption.value === "") {
        this.deleteTag();
      }
      if (this.selectNow.code && !(this.inputOption.value.indexOf("：") < 0)) {
        this.selectNow = {};
        this.resetPopoverOption();
      }
    },
    // 按下回车键
    onSearchKeyEnter() {
      // console.log('onSearchKeyEnter')
      const selectNow = this.selectNow;
      if (selectNow.title) {
        this.clickPopoverSubmit(selectNow.select);
      }
    },
    // 点击删除按钮
    onClickDelete(index) {
      // console.log('onClickDelete')
      this.deleteTag(index);
    },
    // 点击搜索按钮
    onClickSearch() {
      // console.log('onClickSearch', this.tagData)
      const searchData = {};
      this.tagData.map((item) => {
        searchData[item.code] = [...item.select.map((item) => item.code)];
      });
      // 组件搜索回调
      this.$emit("search", searchData, this.tagData);
      // 还原状态
      this.onSearchBlur();
    },
    // 点击类目
    clickPopoverRadio(item) {
      // console.log('clickPopoverRadio', item)
      this.inputOption.value = `${item.title}：`;
      this.setInputWidth();
      this.selectNow = item;
      if (item.select_type === "select") {
        this.popoverOption.isCheckBox = true;
        this.popoverOption.option = item.data;
      } else {
        this.popoverOption.isCheckBox = false;
        this.popoverOption.isShow = false;
        this.$refs.input.focus();
      }
      this.setPopoverPosition();
    },
    // 点击多选
    clickPopoverCheckbox(data) {
      // console.log('clickPopoverCheckbox', data)
      const val = `${this.selectNow.title}：${data
        .map((i) => i.title)
        .join(" | ")}`;
      this.inputOption.value = val;
      this.popoverOption.isDisabled = data.length === 0;
      this.setInputWidth();
      this.inputFocus();
      this.showPopover();
    },
    // 点击提交
    clickPopoverSubmit(data) {
      // console.log('clickPopoverSubmit', data)
      this.tagData.push({
        ...this.selectNow,
        select: data,
      });
      this.selectNow = {};
      this.raiseTag();
    },
    // 弹窗取消
    clickPopoverReset() {
      // console.log('clickPopoverReset', data)
      this.inputOption.value = "";
      this.selectNow = {};
      this.setInputWidth();
      this.raiseTag();
    },
    // 标签获取焦点
    tagFocus(index) {
      // console.log('tagFocus', index)
      this.showPopoverEle = "" + index;
      this.hidePopover();
    },
    // 标签修改提交
    tagSubmit(data, index) {
      // console.log('tagSubmit', data, index)
      this.$set(this.tagData, index, data);
    },
    /**
     * 复用性方法：
     */
    // 显示弹窗
    showPopover() {
      // console.log('showPopover')
      this.popoverOption.isShow = true;
      this.setPopoverPosition();
    },
    // 隐藏弹窗
    hidePopover() {
      // console.log('hidePopover')
      this.popoverOption.isShow = false;
    },
    // 获取焦点
    inputFocus() {
      // console.log('inputFocus')
      this.inputOption.isFocus = true;
      this.$nextTick(() => {
        this.$refs.input.focus();
      });
    },
    // 失去焦点
    inputBlur() {
      // console.log('inputBlur')
      this.inputOption.isFocus = false;
    },
    // 处理弹窗数据
    initPopoverData() {
      // console.log('initPopoverData', this.popoverData)
    },
    // 还原输入框配置
    resetInputOption() {
      // console.log('resetInputOption')
      this.inputOption.value = "";
      this.setInputWidth();
    },
    // 还原弹窗配置
    resetPopoverOption() {
      // console.log('resetPopoverOption')
      if (!this.selectNow.code) {
        const tagData = this.tagData;
        this.popoverOption.isShow = false;
        this.popoverOption.isCheckBox = false;
        this.popoverOption.option = this.selectOption.filter((item) => {
          return tagData.findIndex((tag) => tag.code === item.code) < 0;
        });
        this.selectNow = {};
      }
    },
    // 新增元素
    raiseTag() {
      // console.log('raiseTag', this.inputOption.value, this.tagData)
      this.resetInputOption();
      this.resetPopoverOption();
      // this.onSearchFocus()
    },
    // 删除元素
    deleteTag(index) {
      // console.log('deleteTag', typeof index, this.inputOption.value, this.tagData)
      if (typeof index === "number") {
        // 有下标，删除单个
        this.tagData.splice(index, 1);
      } else if (typeof index === "string") {
        // 删除全部
        this.tagData = [];
      } else {
        // 无下标，删除最后一个
        if (this.tagData.length >= 1) {
          this.tagData.splice(this.tagData.length - 1, 1);
        }
      }
      this.$nextTick(() => {
        this.resetPopoverOption();
        this.setInputWidth();
        this.inputFocus();
        this.showPopover();
      });
    },
    // 设置弹窗位置
    setPopoverPosition() {
      // console.log('setPopoverPosition')
      this.$nextTick(() => {
        const marginLeft = this.selectNow.title
          ? this.getTextWidth(`${this.selectNow.title}：`)
          : 0;
        const inputBox = this.$refs.input_box;
        const bodyWidth = document.body.offsetWidth;
        const popoverWidth =
          this.$refs.popover_box.$el.offsetWidth + marginLeft;
        const offsetLeft =
          inputBox.offsetLeft + inputBox.offsetParent.offsetLeft;
        const left =
          offsetLeft + popoverWidth < bodyWidth
            ? offsetLeft
            : bodyWidth - popoverWidth;
        const top =
          inputBox.offsetTop +
          inputBox.offsetParent.offsetTop +
          inputBox.offsetHeight;
        [
          this.popoverOption.left,
          this.popoverOption.top,
          this.popoverOption.marginLeft,
        ] = [left, top, marginLeft];
      });
    },
    // 设置元素宽度
    setInputWidth() {
      // console.log('setInputWidth')
      const value = this.inputOption.value;
      const width = this.getTextWidth(value);
      const offsetWidth = this.$refs.input_box.offsetParent.offsetWidth - 64;
      this.inputOption.width = width > offsetWidth ? offsetWidth : width;
    },
    // 获取字符宽度，返回像素值
    getTextWidth(str) {
      this.$refs.text_width.innerHTML = str;
      const width = this.$refs.text_width.offsetWidth;
      return width;
    },
  },
};
</script>

<style lang="less" scoped>
.my_search {
  width: 400px;
  height: 30px;
  .search_box {
    width: 100%;
    min-height: 30px;
    height: 30px;
    overflow: hidden;
    background-color: #fff;
    text-align: left;
    position: relative;
    cursor: text;
    padding: 0 60px 0 4px;
    border: 1px solid #cfd5de;
    font-size: 12px;
    box-sizing: border-box;
    border-radius: 0;
    .tag_group {
      margin-top: 0;
      vertical-align: top;
      white-space: nowrap;
      display: inline-block;
      // font-size: 0;
      line-height: normal;
      /deep/.tag_item {
        pointer-events: none;
        display: inline-block;
        min-height: 20px;
        width: auto;
        position: relative;
        vertical-align: inherit;
        .tag_label {
          position: relative;
          background-color: #f3f4f7;
          color: #000;
          margin: 4px 4px 0 0;
          padding: 0 8px;
          height: auto;
          line-height: 18px;
          // font-size: 0;
          vertical-align: middle;
          border: 1px solid #f3f4f7;
          border-radius: 0;
          margin-top: 4px;
          &,
          .tag_title,
          .tag_content {
            display: inline-block;
            white-space: nowrap;
            word-wrap: break-word;
            word-break: break-word;
          }
          .tag_title,
          .tag_content {
            font-size: 12px;
            vertical-align: top;
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .tag_title {
            color: rgba(0, 0, 0, 0.4) !important;
          }
          .del {
            cursor: pointer;
            display: none;
            position: absolute;
            right: 6px;
            bottom: 2px;
          }
        }
        .tag_input_box {
          font-size: 0;
          line-height: normal;
          white-space: normal;
          display: inline-block;
          min-height: 20px;
          width: auto;
          position: relative;
          vertical-align: inherit;
          .tag_input {
            display: inline-block;
            position: relative;
            height: 100%;
            width: 280px;
            max-width: 764px;
            padding: 0px 8px;
            .textarea {
              font-family: inherit;
              margin: 0;
              overflow: auto;
              display: inline-block;
              box-sizing: border-box;
              vertical-align: middle;
              font-size: 12px;
              border-radius: 0;
              background-color: #fff;
              color: rgba(0, 0, 0, 0.9);
              transition: 0.2s ease-in-out;
              transition-property: color, background-color, border;
              outline: none;
              line-height: 20px;
              border: none;
              padding: 0 5px 0 0;
              position: absolute;
              top: 0px;
              left: 0px;
              height: 100%;
              resize: none;
              min-height: 20px;
              margin-top: 4px;
            }
          }
        }
      }
      .input_box {
        display: inline-block;
        vertical-align: top;
        position: relative;
        width: 6px;
        max-width: 100%;
        .search_input {
          box-sizing: border-box;
          font-size: 12px;
          border-radius: 0;
          background-color: #fff;
          color: rgba(0, 0, 0, 0.9);
          transition: 0.2s ease-in-out;
          transition-property: color, background-color, border;
          width: auto;
          min-width: 1px;
          position: static;
          border: none;
          vertical-align: top;
          margin-top: 4px;
          height: 20px;
          line-height: 20px;
          padding: 0 5px 0 0;
          width: 6px;
          max-width: 100%;
          display: none;
        }
      }
    }
    .tips {
      position: relative;
      user-select: none;
      line-height: 21px;
      font-size: 12px;
      margin-top: 4.5px;
      display: inline-block;
      color: rgba(0, 0, 0, 0.25);
    }
    .btn_search,
    .btn_del_all {
      width: 30px;
      height: 28px;
      bottom: 0;
      padding: 6px 7px;
      background-color: #fff;
      vertical-align: middle;
      position: absolute;
      z-index: 4;
      cursor: pointer;
      // font-size: 0;
      border: none;
      text-align: center;
      right: 0px;
      outline: none;
    }
    .btn_del_all {
      right: 26px;
      display: none;
    }
    &:hover,
    &:focus {
      border-color: #006eff;
    }
    /* 获取焦点 */
    &.active {
      border-color: #006eff;
      height: auto;
      background-color: #fff;
      width: 100%;
      z-index: 4000;
      .tag_group {
        white-space: normal;
        /deep/.tag_item {
          pointer-events: auto;
          .tag_label {
            padding: 0 25px 0 10px;
            .tag_title,
            .tag_content {
              display: inline;
              max-width: none;
              white-space: normal;
              vertical-align: middle;
            }
            .del {
              display: inline-block;
            }
          }
        }
        .input_box {
          .search_input {
            display: inline-block;
            outline: 0;
          }
        }
      }
      .btn_del_all {
        display: inline-block;
      }
    }
  }
  .text_width {
    position: absolute;
    top: -9999px;
    left: 0px;
    white-space: pre;
    font-size: 12px;
    font-family: "SimSun", "宋体";
  }
}
</style>
