<template>
  <div>
    <div
      class="search_box"
      :class="isFocus ? 'active' : ''"
      @click.stop="searchFocus"
    >
      <div class="tag_group">
        <div class="tag_item" v-for="(item, index) in searchData" :key="index">
          <div class="tag_label">
            <span class="tag_title">{{ item.name }}：</span>
            <span class="tag_content">
              <template v-for="(item1, i) in item.value">
                <template v-if="i != 0">|</template>
                {{ item1 | searchFilter(item.key, defaultData) }}
              </template>
            </span>
            <i class="del" @click.stop="deleteItem(index)"></i>
          </div>
          <div class="tag_input">
            <textarea class="textarea" @input="searchInput"></textarea>
          </div>
        </div>
        <div
          ref="input_box"
          class="input_box"
          :style="{ width: `${inputWidth + 6}px` }"
        >
          <input
            ref="search_input"
            class="search_input"
            type="text"
            v-model="inputText"
            :style="{ width: `${inputWidth + 6}px` }"
            @input="searchInput"
            @keydown.enter="enterKeydown"
          />
        </div>
      </div>
      <div class="tips">
        多个关键字用竖线 “|” 分隔，多个过滤标签用回车键分隔
      </div>
      <button class="btn_del_all">
        <i class="del_all" @click.stop="deleteItem"></i>
      </button>
      <button class="btn_search">
        <i class="search" @click.stop="startSearch"></i>
      </button>
    </div>
    <div>
      <p>搜索内容：</p>
      <p class="search_data">
        <template v-for="item in searchData">
          {{ item.name }}：
          <template v-for="i in item.value">
            {{ i | searchFilter(item.key, defaultData) }}、
          </template>
          ；
        </template>
      </p>
    </div>
    <div
      class="overlay_box"
      ref="overlay_box"
      v-show="overlay.isShow && overlayData.length"
      :style="{ left: overlay.left, top: overlay.top }"
    >
      <div class="overlay" :style="{ marginLeft: `${overlay.marginLeft}px` }">
        <ul class="list" v-if="!overlay.isCheckbox">
          <li class="is_disabled">选择资源属性进行过滤</li>
          <template class="" v-for="(item, index) in overlayData">
            <li
              v-if="!item.isUse"
              :key="index"
              @click.stop="overlayClick(item.key)"
            >
              {{ item.name }}
            </li>
          </template>
        </ul>
        <ul class="list" v-else>
          <li class="is-current" @click.stop="checkboxClick">
            <label class="check_label">
              <input class="checkbox" type="checkbox" v-model="checkAll" />
              <span class="check_span">全选</span>
            </label>
          </li>
          <template class="" v-for="(item, index) in overlayData">
            <li
              v-if="!item.isUse"
              :key="index"
              @click.stop="checkboxClick(index)"
            >
              <label class="check_label">
                <input
                  class="checkbox"
                  type="checkbox"
                  :value="item.key"
                  v-model="checkboxData"
                />
                <span class="check_span">{{ item.name }}</span>
              </label>
            </li>
          </template>
        </ul>
        <div class="overlay_footer" v-if="overlay.isCheckbox">
          <button
            class="btn"
            :class="overlay.isDisabled ? 'is_disabled' : ''"
            :disabled="overlay.isDisabled"
            @click.stop="chekcboxSubmit"
          >
            确认
          </button>
          <button class="btn btn_close" @click.stop="chekcboxHide">取消</button>
        </div>
      </div>
    </div>
    <span ref="text_width" class="text_width"></span>
  </div>
</template>

<script>
export default {
  name: "search",
  data() {
    return {
      isFocus: false,
      inputWidth: 0,
      overlay: {
        isShow: false,
        isCheckbox: false,
        left: 0,
        top: 0,
        marginLeft: 0,
        isDisabled: true,
      },
      inputText: "",
      selectIndex: "",
      // 搜索框所有可选数据，
      defaultData: {
        name: {
          name: "ID/名称",
          type: "text",
          isUse: false,
        },
        state: {
          name: "状态",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "DELETE", name: "已删除" },
            { key: "ERROR", name: "异常状态" },
            { key: "HARD_REBOOT", name: "强制重启" },
            { key: "LAUNCH_FAILED", name: "创建失败" },
            { key: "MIGRATING", name: "热迁移" },
            { key: "PENDING", name: "创建中" },
            { key: "REBOOTING", name: "重启中" },
            { key: "REBUILD", name: "重建中" },
            { key: "RECYCLING", name: "回收中" },
            { key: "RESETTING", name: "调整配置中" },
            { key: "RUNNING", name: "运行中" },
            { key: "SHUTDOWN", name: "待回收" },
            { key: "START", name: "开机中" },
            { key: "STOPPED", name: "关机" },
            { key: "STOPPING", name: "关机中" },
            { key: "TERMINATING", name: "销毁中" },
          ],
        },
        cloud_type: {
          name: "云环境",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "Tencent", name: "腾讯云" },
            { key: "Alibaba", name: "阿里云" },
            { key: "Huawei", name: "华为云" },
          ],
        },
        instanceIpAddress: {
          name: "IPv4",
          type: "text",
          isUse: false,
        },
        instanceFamily: {
          name: "实例类型",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "MA2", name: "内存型MA2" },
            { key: "CS5", name: "标准型S5" },
            { key: "CS5se", name: "标准存储增强型S5se" },
            { key: "CSA2", name: "标准型SA2" },
          ],
        },
        instanceChargeType: {
          name: "实例计费模式",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "CDHPAID", name: "CDH计费" },
            { key: "CPOSTPAID_BY_HOUR", name: "按量计费" },
            { key: "CPREPAID", name: "包年包月" },
          ],
        },
        instanceChargeType1: {
          name: "实例计费模式1",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "CDHPAID", name: "CDH计费" },
            { key: "CPOSTPAID_BY_HOUR", name: "按量计费" },
            { key: "CPREPAID", name: "包年包月" },
          ],
        },
        instanceChargeType2: {
          name: "实例计费模式2",
          type: "checkbox",
          isUse: false,
          checkList: [
            { key: "CDHPAID", name: "CDH计费" },
            { key: "CPOSTPAID_BY_HOUR", name: "按量计费" },
            { key: "CPREPAID", name: "包年包月" },
          ],
        },
      },
      // 搜索时默认未知类目添加的地方，指向实例名和id
      defaultKey: "name",
      defaultIndex: null,
      // 下拉框数据
      overlayData: [{ key: "name", name: "名称" }],
      checkboxData: [],
      checkAll: false,
      // 搜索数据
      searchObj: {
        page: 2,
        total_page: 7,
        count: 65,
        next: "",
        previous: "",
      },
      // 搜索框的原始数据
      searchData: [
        {
          key: "name",
          name: "ID/名称",
          value: ["sjidoawu", "wjoifja"],
        },
        {
          key: "state",
          name: "状态",
          type: "checkbox",
          value: ["RUNNING", "PENDING"],
        },
      ],
    };
  },
  created() {
    this.getLocation();
    this.initOverlayData();
  },
  mounted() {
    window.onclick = () => {
      this.searchBlur();
    };
  },
  methods: {
    /**
      1、页面初始化获取地址栏内容渲染
      2、点击标签元素进行二次修改，点击搜索框进行搜索新建，
      3、搜索元素内如果没有类型，则默认为搜索名称，
      4、创建元素时判断所需类型，有下拉选项则提供下拉选项,
      
      输入处理，
        初始化输入框，
        输入的内容匹配冒号，记录名称，如果有弹窗显示弹窗，未匹配到则无视
        键盘事件：
          输入回车，匹配输入内容，截取内容，添加进搜索数据
          输入退格，如果删除冒号，则删除记录名称，如果为空，则执行删除指令，删除最后一个搜索数据

      搜索时，加入防抖，间隔一段时间从已选择的与已输入的内容里面进行提交搜索，

      整个文本框失去焦点时，清空输入数据，还原搜索数据，
      
      而输入的内容有格式要求的字段进行效验提示，
      单个标签元素失去焦点时，保留并校验选择或输入的内容。

    */
    // 获取地址栏搜索数据
    getLocation() {
      // 解析为搜索项
      this.searchData.map((item) => {
        this.defaultData[item.key].isUse = true;
      });
      let search = window.location.href.split("?")[1];
      if (search) {
        search = decodeURIComponent(search);
        search = search.split("&").map((item, index) => {
          let key = item.split("=")[0];
          let value = item.split("=")[1].split(",");
          this.defaultData[key].isUse = true;
          if (key == this.defaultKey) {
            this.defaultIndex = index;
          }
          return {
            key,
            ...this.defaultData[key],
            value,
          };
        });
        this.searchData = search;
      }
    },
    // 参数添加到地址栏
    setLocation() {
      let newUrl =
        window.location.href.split("?")[0] +
        "?" +
        encodeURIComponent(
          this.searchData.map((i) => `${i.key}=${i.value.join(",")}`).join("&")
        );
      window.history.replaceState("", "", newUrl);
      console.log(newUrl);
    },
    // 获取焦点
    searchFocus() {
      // 显示下拉内容;
      this.isFocus = true;
      this.$nextTick(() => {
        this.overlayToggle();
        this.$refs.search_input.focus();
      });
    },
    // 输入框输入
    searchInput() {
      let text = this.inputText;
      // 判断输入的内容，筛选下拉或隐藏下拉框，为空则显示下拉框
      // 输入冒号后查找是否正确，若有相对于的类目则进行记录
      if (text.length == 0) {
        this.overlay.isShow = true;
        this.checkboxClear();
      } else {
        this.overlay.isShow = false;
        if (text.indexOf(":") > 0) {
          // 检测到输入了冒号
          let str = text.split(":")[0];
          let defaultData = this.defaultData;
          let selectIndex = Object.keys(defaultData).filter(
            (item) => item == str || defaultData[item].name == str
          )[0];
          if (this.defaultData[selectIndex]?.type == "checkbox") {
            this.checkboxShow();
          } else {
            this.overlay.isCheckbox = false;
          }
          this.selectIndex = selectIndex;
        }
      }
      this.changeCheckboxList();
      this.inputWidth = this.getTextWidth(this.inputText);
    },
    // 输入回车键
    enterKeydown() {
      // 获取当前输入内容，截取字符，判断是否是有该类名称，
      // 如果有就添加为那一类，没有则把内容添加为实例名，
      let value = this.inputText;
      let selectIndex = this.selectIndex;
      let text = "";
      if (!value) {
        return;
      }
      if (selectIndex) {
        // 选择过类目
        text = value.split(":")[1].split("|");
        console.log(selectIndex);
        let obj = {
          key: selectIndex,
          ...this.defaultData[selectIndex],
          value: [...text],
        };
        if (obj.type == "checkbox") {
          // 多选的类筛选数据
          obj.value = obj.value.filter((item) =>
            obj.checkList.some((i) => i.key == item || i.name == item)
          );
        }
        if (obj.value.length > 0) {
          this.defaultData[selectIndex].isUse = true;
          this.searchData.push(obj);
        } else {
          console.log("请输入正确类型");
        }
      } else {
        // 未选择过下拉菜单，属于未知类目，添加至实例名
        text = (value.split(":")[1] || value.split(":")[0]).split("|");
        console.log(text);
        let defaultIndex = this.defaultIndex;
        let defaultKey = this.defaultKey;
        if (this.searchData[defaultIndex]) {
          this.searchData[this.defaultIndex].value = [
            ...this.searchData[this.defaultIndex].value,
            ...text,
          ];
        } else {
          this.defaultData[defaultKey].isUse = true;
          this.searchData.push({
            key: defaultKey,
            ...this.defaultData[defaultKey],
            value: text,
          });
        }
      }
      this.initOverlayData();
      this.clearInput();
      this.$refs.search_input.focus();
      this.overlayToggle();
    },
    // 失去焦点，清空输入内容
    searchBlur() {
      this.isFocus = false;
      this.clearInput();
      this.overlayToggle();
    },
    // 切换下拉框状态
    overlayToggle() {
      if (this.isFocus) {
        this.overlay.isShow = true;
        this.$nextTick(() => {
          let input_box = this.$refs.input_box;
          let left = input_box.offsetLeft + input_box.offsetParent.offsetLeft;
          let top =
            input_box.offsetTop +
            input_box.offsetParent.offsetTop +
            input_box.offsetHeight;
          let bodyWidth = document.body.offsetWidth;
          let overlayWidth = this.$refs.overlay_box.offsetWidth;
          if (left + overlayWidth > bodyWidth) {
            left = bodyWidth - overlayWidth;
          }
          [this.overlay.left, this.overlay.top] = [left + "px", top + "px"];
        });
      } else {
        this.overlay.isShow = false;
      }
    },
    // 下拉选择
    overlayClick(key) {
      // 赋值到文本框，添加到搜索对象
      console.log("选择下拉内容", key);
      let str = this.defaultData[key].name + ":";
      this.inputText = str;
      this.selectIndex = key;
      this.inputWidth = this.getTextWidth(str);
      this.$refs.search_input.focus();
      if (this.defaultData[key].type == "checkbox") {
        this.checkboxShow();
      } else {
        this.overlay.isShow = false;
      }
    },
    // 搜索按钮
    startSearch() {
      this.setLocation();
    },
    // 修改下拉选数据
    changeCheckboxList() {
      let isCheckbox = this.overlay.isCheckbox;
      console.log(isCheckbox);
      if (isCheckbox) {
        let overlayData = [];
        overlayData = this.defaultData[this.selectIndex].checkList;
        this.overlayData = overlayData;
      } else {
        this.initOverlayData();
      }
      this.checkboxData = [];
    },
    // 切换为多选框
    checkboxShow() {
      let inputWidth = this.getTextWidth(this.inputText.split(":")[0] + ":");
      this.overlay.isShow = true;
      this.overlay.isCheckbox = true;
      this.overlay.marginLeft = inputWidth;
      this.$nextTick(() => {
        this.changeCheckboxList();
      });
    },
    // 清空多选状态
    checkboxClear() {
      this.overlay.isCheckbox = false;
      this.overlay.marginLeft = 0;
      this.checkboxData = [];
    },
    // 提交多选
    chekcboxSubmit() {
      this.checkboxClear();
      this.enterKeydown();
    },
    // 关闭多选
    chekcboxHide() {
      this.checkboxClear();
      this.searchBlur();
    },
    // 分类多选框
    checkboxClick(index) {
      // 当输入或者选择分类后触发，
      // 修改overlay的数据及一些状态开关，
      let overlayData = this.overlayData;
      let checkboxData = [];
      let checkAll = false;
      let inputText = this.inputText.split(":")[0];
      // 判断是否全选
      if (overlayData[index]) {
        // 单选
        this.overlayData[index];
        overlayData[index].checked = !overlayData[index].checked;
        checkboxData = overlayData
          .filter((item) => item.checked)
          .map((i) => i.key);
        checkAll = checkboxData.length == overlayData.length;
      } else {
        // 全选
        checkAll = !this.checkAll;
        overlayData.map((item) => {
          item.checked = checkAll;
        });
        checkboxData = checkAll ? overlayData.map((i) => i.key) : [];
      }
      // 赋值到输入框
      inputText =
        inputText +
        ":" +
        overlayData
          .filter((item) => item.checked)
          .map((item) => item.name)
          .join("|");
      console.log(inputText);
      this.inputText = inputText;
      this.inputWidth = this.getTextWidth(inputText);
      this.checkAll = checkAll;
      this.checkboxData = checkboxData;
      this.overlay.isDisabled = checkboxData.length == 0;
    },
    /**
     * 删除，修改默认数据里的isUse状态，
     * 初始化下拉框数据，重新获取焦点，同步到地址栏，
     */
    deleteItem(index) {
      if (this.searchData[index]) {
        // 删除单个
        let key = this.searchData[index].key;
        this.defaultData[key].isUse = false;
        key == this.defaultKey && (this.defaultIndex = null);
        this.searchData.splice(index, 1);
      } else {
        // 删除全部
        Object.keys(this.defaultData).map((item) => {
          this.defaultData[item].isUse = false;
        });
        this.defaultIndex = null;
        this.searchData = [];
      }
      this.initOverlayData();
      this.searchFocus();
    },
    // 还原输入框状态
    clearInput() {
      this.inputText = "";
      this.inputWidth = 0;
    },
    // 初始化下拉框数据
    initOverlayData() {
      let defaultData = this.defaultData;
      let arr = Object.keys(defaultData).filter((i) => !defaultData[i].isUse);
      this.overlayData = arr.map((i) => {
        return { key: i, ...defaultData[i] };
      });
    },
    // 获取字符宽度，返回像素值
    getTextWidth(str) {
      console.log(str);
      this.$refs.text_width.innerHTML = str;
      let width = this.$refs.text_width.offsetWidth;
      return width;
    },
  },
  filters: {
    searchFilter(str, key, data) {
      let string =
        data[key]?.checkList?.filter((i) => {
          return i.key == str || i.name == str;
        })[0]?.name || str;
      return string;
    },
  },
};

</script>


<style scoped>
* {
  box-sizing: border-box;
}
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
  font-size: 0;
  box-sizing: border-box;
  border-radius: 0;
}
.tag_group {
  margin-top: 0;
  vertical-align: top;
  white-space: nowrap;
  display: inline-block;
  font-size: 0;
  line-height: normal;
}
.tag_item {
  display: inline-block;
  min-height: 20px;
  width: auto;
  position: relative;
  vertical-align: inherit;
}
.tag_label {
  position: relative;
  background-color: #f3f4f7;
  color: #000;
  margin: 4px 4px 0 0;
  padding: 0 8px;
  height: auto;
  line-height: 18px;
  font-size: 0;
  vertical-align: middle;
  border: 1px solid #f3f4f7;
  border-radius: 0;
  margin-top: 4px;
}
.tag_label,
.tag_label span {
  display: inline-block;
  white-space: nowrap;
  word-wrap: break-word;
  word-break: break-word;
}
.tag_label span {
  font-size: 12px;
  vertical-align: top;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tag_label .del {
  cursor: pointer;
  display: none;
  position: absolute;
  right: 7px;
  bottom: 1px;
}
.tag_title {
  color: rgba(0, 0, 0, 0.4) !important;
}
.tag_input {
  display: inline-block;
  position: relative;
  width: 0px;
}
.tag_input textarea {
  width: 10px;
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  resize: none;
  overflow: hidden;
  min-height: 20px;
  margin-top: 4px;
  border: none;
  outline: none;
  vertical-align: top;
  display: inline-block;
  font-size: 12px;
  border-radius: 0;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.9);
  transition: 0.2s ease-in-out;
  transition-property: color, background-color, border;
  line-height: 20px;
  padding: 0 5px 0 0;
}
.input_box {
  display: inline-block;
  vertical-align: top;
  position: relative;
  width: 6px;
}
.input_box .search_input {
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
  max-width: 764px;
  display: none;
}
.text_width {
  position: absolute;
  top: -9999px;
  left: 0px;
  white-space: pre;
  font-size: 12px;
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
  font-size: 0;
  border: none;
  text-align: center;
  right: 0px;
  outline: none;
}
.btn_del_all {
  right: 26px;
  display: none;
}
.tag_label i,
.btn_del_all i {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbD0iIzg4OCIgZD0iTTggMWE3IDcgMCAxMDAgMTRBNyA3IDAgMDA4IDF6bTMuNTM2IDkuMTIxbC0xLjQxNCAxLjQxNEw4IDkuNDE0bC0yLjEyMSAyLjEyMS0xLjQxNC0xLjQxNEw2LjU4NiA4IDQuNDY0IDUuODc5bDEuNDE0LTEuNDE0TDggNi41ODZsMi4xMjEtMi4xMjEgMS40MTQgMS40MTRMOS40MTQgOGwyLjEyMiAyLjEyMXoiLz48L3N2Zz4=);
}
.btn_search i {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiM4ODgiIGQ9Ik0xNSAxM2wtMi44ODEtMi44ODFDMTIuNjc0IDkuMjA5IDEzIDguMTQ0IDEzIDdhNiA2IDAgMTAtNiA2IDUuOTY4IDUuOTY4IDAgMDAzLjExOS0uODgxTDEzIDE1bDItMnpNMyA3YTQgNCAwIDExOCAwIDQgNCAwIDAxLTggMHoiLz48L3N2Zz4=);
}
.search_box.active {
  border-color: #006eff;
  height: auto;
  background-color: #fff;
  width: 100%;
}
.search_box.active .tag_group {
  white-space: normal;
}
.search_box.active .tag_group .tag_label span {
  max-width: initial;
}
.search_box.active .input_box .search_input {
  display: inline-block;
  outline: 0;
}
.search_box.active .btn_del_all {
  display: inline-block;
}
.search_box.active .tag_item .tag_label {
  padding: 0 25px 0 10px;
}
.search_box.active .tag_item .del {
  display: inline-block;
}
.tag_item.active .tag_label {
  display: none;
}
.tag_item.active .tag_input {
  display: block;
}
/* 弹层 */
.overlay_box {
  user-select: none;
  z-index: 1000;
  position: fixed;
}
.overlay {
  border-radius: 0;
  background-color: #fff;
  box-shadow: 0 0 16px 0 rgb(54 58 80 / 16%);
  min-width: 150px;
  color: rgba(0, 0, 0, 0.9);
  position: relative;
}
.overlay .list {
  padding: 0;
  list-style: none;
  color: rgba(0, 0, 0, 0.9);
  overflow-y: auto;
  margin: 0;
  /* max-height: 165px; */
}
.overlay .list li {
  margin-bottom: 0;
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
}
.overlay .list li:hover {
  background-color: #ebeef2;
}
.overlay .list li.is_disabled {
  background-color: transparent;
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
}
/* 弹层换多选 */
.overlay .list li.is-current {
  background-color: #ebeef2;
  cursor: pointer;
}
.overlay .list li .check_label {
  pointer-events: none;
  position: relative;
  display: inline-block;
  vertical-align: middle;
  padding-left: 20px;
  margin: 0;
  min-height: 16px;
  color: rgba(0, 0, 0, 0.9);
}
.overlay .list li .checkbox {
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
}
.overlay .list li .checkbox:hover,
.overlay .list li .checkbox:focus {
  border-color: #006eff;
}
.overlay .list li .checkbox:checked {
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQiIGhlaWdodD0iMTQiPjxkZWZzPjxwYXRoIGlkPSJhIiBkPSJNNS43IDguM0wyLjkgNS41IDEuNSA2LjlsNC4yIDQuMiA2LjQtNi40LTEuNC0xLjQtNSA1eiIvPjwvZGVmcz48dXNlIHhsaW5rOmhyZWY9IiNhIiBvdmVyZmxvdz0idmlzaWJsZSIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNmZmYiLz48L3N2Zz4=);
  background-color: #006eff;
  border-color: #006eff;
  background-position: inherit;
  background-size: 100% auto;
}
.overlay .list li .check_span {
  line-height: 16px;
  cursor: pointer;
  font-size: 12px;
}
.overlay .overlay_footer {
  margin: 0 10px;
  border-top: 1px solid #e7eaef;
  padding: 10px 0;
  white-space: nowrap;
}
.overlay .overlay_footer .btn {
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
}
.overlay .overlay_footer .btn.is_disabled {
  border-color: #aacfff;
  background-color: #aacfff;
  color: #fff;
  cursor: not-allowed;
}
.overlay .overlay_footer .btn.btn_close {
  background-color: #fff;
  color: #006eff;
  border: none;
  margin-left: 5px;
}
.overlay .overlay_footer .btn:focus,
.overlay .overlay_footer .btn:hover {
  color: #fff;
  transition: all 0.3s ease-in-out;
  border-color: #2a86ff;
  background-color: #2a86ff;
}
.overlay .overlay_footer .btn.is_disabled:focus,
.overlay .overlay_footer .btn.is_disabled:hover {
  border-color: #aacfff;
  background-color: #aacfff;
  color: #fff;
}
.overlay .overlay_footer .btn.btn_close:focus,
.overlay .overlay_footer .btn.btn_close:hover {
  background-color: #ebeef2;
  border-color: #cfd5de;
  color: #006eff;
}
i {
  width: 16px;
  height: 16px;
  display: inline-block;
  vertical-align: middle;
  background-repeat: no-repeat;
  background-position: inherit;
  font-size: 0;
}
</style>