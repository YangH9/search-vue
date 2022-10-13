<template>
  <div
    class="popover_box"
    @click.stop=""
    v-show="popoverOption.isShow"
    :style="{
      left: `${popoverOption.left}px`,
      top: `${popoverOption.top + 10}px`,
    }"
  >
    <div
      class="popover"
      :style="{ marginLeft: `${popoverOption.marginLeft}px` }"
    >
      <ul class="list" v-if="!popoverOption.isCheckBox">
        <li class="item is_disabled">选择资源属性进行过滤</li>
        <template class="" v-for="(item, index) in checkboxOption">
          <li
            class="item"
            v-if="!item.isUse"
            :key="index"
            @click.stop="clickRadio(item)"
          >
            {{ item.title }}
          </li>
        </template>
      </ul>
      <ul class="list" v-else>
        <el-checkbox
          class="item is_current"
          :indeterminate="isIndeterminate"
          v-model="isCheckAll"
          @change="clickCheckbox"
        >
          全选
        </el-checkbox>
        <el-checkbox-group v-model="checkedData">
          <el-checkbox
            class="item"
            v-for="(item, index) in checkboxOption"
            :key="index"
            :label="item.code"
            @change="clickCheckbox"
          >
            {{ item.title }}
          </el-checkbox>
        </el-checkbox-group>
      </ul>
      <div class="popover_footer" v-if="popoverOption.isCheckBox">
        <button
          class="btn"
          :class="popoverOption.isDisabled ? 'is_disabled' : ''"
          :disabled="popoverOption.isDisabled"
          @click.stop="clickSubmit"
        >
          确认
        </button>
        <button class="btn btn_close" @click.stop="clickReset">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    // 配置项，isShow、isCheckBox、option
    popoverOption: Object,
    // 多选的默认选中数据
    popoverData: Array,
  },
  computed: {
    // 多选事件效果
    isCheckAll: {
      get() {
        return this.checkboxOption.length === this.checkedData.length;
      },
      set(val) {
        this.checkedData = val
          ? this.checkboxOption.map((item) => item.code)
          : [];
      },
    },
    isIndeterminate() {
      return (
        this.checkedData.length > 0 &&
        this.checkedData.length < this.checkboxOption.length
      );
    },
  },
  watch: {
    // 监听变化，记录数据
    popoverOption: {
      handler(val) {
        // console.log('searchPopover---watch---popoverOption', val)
        if (this.checkboxOption !== val.option) {
          this.checkboxOption = val.option;
          this.oldData = this.popoverData;
          if (val.isCheckBox) {
            // 如果为多选框，先清空选择数据
            this.checkedData = [];
          }
        }
      },
      deep: true,
    },
    popoverData: {
      handler(val) {
        // console.log('searchPopover---watch---popoverData')
        this.checkedData = val;
      },
      deep: true,
    },
    // checkedData: {
    //   handler() {
    //     if (this.popoverOption.isShow && this.checkboxOption.length) {
    //       // console.log('searchPopover---watch---checkedData')
    //       // this.clickCheckbox()
    //     }
    //   },
    //   deep: true
    // }
  },
  data() {
    return {
      // 下拉框元素数据
      checkboxOption: [],
      // 下拉框选择数据
      checkedData: [],
      // 初次传入的值，用于还原
      oldData: [],
    };
  },
  methods: {
    /**
     * 下拉框弹窗，下拉框配置
     */
    changeCheckBoxData(list) {
      this.checkedData = list;
    },
    // 点击选项
    clickRadio(item) {
      // 单选状态，直接返回点击的参数
      this.$emit("clickRadio", item);
    },
    // 点击多选
    clickCheckbox() {
      // 多选状态，数据同步至父组件
      this.$emit("clickCheckbox", this.getCheckedObj(this.checkedData));
    },
    // 点击提交
    clickSubmit() {
      // 多选状态，点击提交返回数组
      this.$emit("clickSubmit", this.getCheckedObj(this.checkedData));
    },
    // 点击还原
    clickReset() {
      // 多选状态，点击还原返回旧数据
      this.$emit("clickReset", this.getCheckedObj(this.oldData));
    },
    // 提取多选数据
    getCheckedObj(data) {
      const checkboxOption = this.checkboxOption;
      return checkboxOption.filter(
        (item) => data.filter((i) => item.code === i).length > 0
      );
    },
  },
};
</script>

<style lang="less" scoped>
.popover_box {
  user-select: none;
  z-index: 4000;
  position: absolute;
  .popover {
    border-radius: 0;
    background-color: #fff;
    box-shadow: 0 0 16px 0 rgba(54, 58, 80, 16%);
    min-width: 150px;
    color: rgba(0, 0, 0, 0.9);
    position: relative;
    .list {
      padding: 0;
      list-style: none;
      color: rgba(0, 0, 0, 0.9);
      overflow-y: auto;
      margin: 0;
      /* max-height: 165px; */
      .item {
        margin-right: 0;
        font-size: 12px;
        padding: 6px 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #000;
        display: block;
        cursor: pointer;
        border-radius: 0 0 0 0;
        line-height: 1.5;
        &:hover {
          background-color: #ebeef2;
        }
        &.is_disabled {
          background-color: transparent;
          color: rgba(0, 0, 0, 0.25);
          cursor: not-allowed;
        }
        &.is_current {
          background-color: #ebeef2;
          cursor: pointer;
        }
        .check_label {
          pointer-events: none;
          position: relative;
          display: inline-block;
          vertical-align: middle;
          padding-left: 20px;
          margin: 0;
          min-height: 16px;
          color: rgba(0, 0, 0, 0.9);
          .checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
            margin: 0;
            vertical-align: middle;
            outline: none;
            -webkit-appearance: none;
            border: 1px solid #cfd5de;
            background-color: #fff;
            border-radius: 0;
            color: rgba(0, 0, 0, 0.9);
            position: absolute;
            top: 0;
            left: 0;
            &:hover,
            &:focus {
              border-color: #006eff;
            }
          }
          .check_span {
            line-height: 16px;
            cursor: pointer;
            font-size: 12px;
          }
        }
      }
    }
    .popover_footer {
      margin: 0 10px;
      border-top: 1px solid #e7eaef;
      padding: 10px 0;
      white-space: nowrap;
      .btn {
        height: 30px;
        min-width: 24px;
        padding: 0 20px;
        background-color: #006eff;
        color: #fff;
        border: 1px solid #006eff;
        line-height: 30px;
        text-align: center;
        display: inline-block;
        cursor: pointer;
        outline: 0 none;
        box-sizing: border-box;
        text-decoration: none;
        font-size: 12px;
        vertical-align: middle;
        white-space: nowrap;
        border-radius: 0;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        &:focus,
        &:hover {
          color: #fff;
          transition: all 0.3s ease-in-out;
          border-color: #2a86ff;
          background-color: #2a86ff;
        }
        &.is_disabled {
          border-color: #aacfff;
          background-color: #aacfff;
          color: #fff;
          cursor: not-allowed;
          &:focus,
          &:hover {
            border-color: #aacfff;
            background-color: #aacfff;
            color: #fff;
          }
        }
        &.btn_close {
          background-color: #fff;
          color: #006eff;
          border: none;
          margin-left: 5px;
          &:focus,
          &:hover {
            background-color: #ebeef2;
            border-color: #cfd5de;
            color: #006eff;
          }
        }
      }
    }
  }
}
</style>
