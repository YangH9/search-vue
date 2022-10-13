<template>
  <div v-if="!textareaOption.isFocus" class="tag_label" @click.stop="tagInputFocus">
    <span class="tag_title">{{ data.title }}：</span>
    <span class="tag_content">{{ textFilter(data.select) }}</span>
    <i class="del el-icon-circle-close" @click.stop="delTag"></i>
  </div>
  <div v-else class="tag_input_box" @click.stop="">
    <div class="tag_input" :style="{ width: `${textareaOption.width}px`, maxWidth: `${maxWidth - 10}px` }">
      <pre style="display: block; visibility: hidden">
        <div
          style="font-size: 12px; white-space: normal; line-height: 20px; max-height: 100px"
          :style="{ width: `${textareaOption.width}px`, maxWidth: `${maxWidth - 10}px` }"
        >
          {{ textareaOption.value }}
        </div>
        <br style="clear: both" />
      </pre>
      <textarea
        ref="textarea"
        class="textarea"
        v-model="textareaOption.value"
        :style="{ width: `${textareaOption.width}px`, maxWidth: `${maxWidth - 10}px` }"
        @focus="tagInputFocus"
        @input="tagInput"
        @keydown.delete="tagKeyDelete"
        @keydown.enter="tagKeyEnter"
      ></textarea>
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
  </div>
</template>

<script>
import searchPopover from './searchPopover.vue'
export default {
  components: { searchPopover },
  props: {
    index: Number,
    isFocus: Boolean,
    maxWidth: Number,
    data: Object,
    textWidth: Function,
    showPopoverEle: String
  },
  data() {
    return {
      textareaOption: {
        isFocus: false,
        value: '',
        width: 0
      },
      tagData: {},
      // 下拉框配置项
      popoverOption: {
        isShow: false,
        isCheckBox: false,
        isDisabled: true,
        option: [],
        top: 0,
        left: 0,
        marginLeft: 0
      },
      // 下拉框选择数据
      popoverData: []
    }
  },
  watch: {
    isFocus(val) {
      if (!val) {
        // 输入框失去焦点
        this.tagBlur()
      }
    },
    showPopoverEle(val) {
      if (val === 'all') {
        // 关闭所有状态
        this.tagBlur()
      } else {
        if (val === '' + this.index) {
          // 开启当前的修改状态
          this.tagFocus()
        } else {
          // 关闭当前的修改状态
          this.tagBlur()
        }
      }
    }
  },
  methods: {
    /**
     * 二次修改
     * 获取焦点，切换状态，显示下拉框，提交数据
     * 点击后提交当前下标，清除下拉框状态，按下标显示不同组件下的弹窗，
     * 外层组件的方法重写入，
     */
    // 点击切换编辑
    tagInputFocus() {
      // console.log('searchTag---tagInputFocus', this.tagData)
      this.$emit('focus', this.index)
      const tagData = this.data
      this.tagData = tagData
      const value = `${tagData.title}：${tagData.select
        .map((item, index) => (index === 0 ? `${item.title}` : ` | ${item.title}`))
        .join('')}`
      this.textareaOption.isFocus = true
      this.textareaOption.value = value
      this.popoverData = tagData.select.map(item => item.code)
      this.$nextTick(() => {
        this.$refs.textarea.selectionStart = tagData.title.length + 1
        this.$refs.textarea.selectionEnd = value.length
        this.$refs.textarea.focus()
        this.tagFocus()
      })
    },
    // 获取焦点
    tagFocus() {
      // console.log('searchTag---tagFocus')
      this.setInputWidth()
      this.showPopover()
    },
    // 输入
    tagInput() {
      const value = this.textareaOption.value
      const tagData = this.tagData
      // console.log('searchTag---tagInput', tagData)
      const index = value.indexOf('：')
      // 截取输入内容
      if (index >= 0) {
        // 有冒号，匹配分类框，
        var selectArr = value.slice(index + 1).split('|')
        // 匹配到，则记录当前分类，进行下一步筛选，
        if (tagData.title) {
          // 匹配后面的值，如果是select类型按照选项值匹配，相反则全部填充
          if (tagData.select_type === 'select') {
            selectArr = selectArr.map(item => tagData.data.find(i => i.title === item.trim()))
            this.$refs.popover_box.changeCheckBoxData(selectArr.map(item => item?.code).filter(i => i))
          } else {
            selectArr = selectArr.map(item => ({ title: item.trim(), code: item.trim() }))
          }
        }
        this.popoverOption.isShow = true
        this.popoverOption.isCheckBox = tagData.select_type === 'select'
        this.popoverOption.option = []
        this.popoverOption.option = tagData.data
        this.tagData = {
          ...this.tagData,
          select: selectArr
        }
      } else {
        this.popoverOption.isShow = tagData.select_type === 'select'
        this.popoverOption.isCheckBox = false
        this.popoverOption.option = [this.tagData]
      }
      this.setInputWidth()
    },
    // 失去焦点
    tagBlur() {
      // console.log('searchTag---tagBlur')
      this.textareaOption.isFocus = false
      this.popoverOption.isShow = false
    },
    // 提交
    tagSubmit() {
      // console.log('searchTag---tagSubmit', this.tagData)
      const tagData = this.tagData
      this.$emit('submit', tagData, this.index)
      this.tagBlur()
    },
    // 按下删除键
    tagKeyDelete() {
      // console.log('searchTag---tagKeyDelete')
      if (this.textareaOption.value === '') {
        this.delTag()
      }
    },
    // 按下回车键
    tagKeyEnter(e) {
      e.preventDefault()
      const tagData = this.tagData
      if (tagData === this.data || JSON.stringify(tagData) === '{}') {
        this.tagBlur()
      } else if (tagData.title) {
        this.clickPopoverSubmit(tagData.select)
      }
      return false
    },
    // 点击类目
    clickPopoverRadio(item) {
      // console.log('searchTag---clickPopoverRadio', item)
      this.textareaOption.value = `${item.title}：`
      this.setInputWidth()
      if (item.select_type === 'select') {
        this.popoverOption.isCheckBox = true
        this.popoverOption.option = item.data
      } else {
        this.popoverOption.isCheckBox = false
        this.popoverOption.isShow = false
        this.$refs.textarea.focus()
      }
      this.showPopover()
    },
    // 点击多选
    clickPopoverCheckbox(data) {
      const val = `${this.tagData.title}：${data.map(i => i.title).join(' | ')}`
      this.textareaOption.value = val
      this.popoverOption.isDisabled = data.length === 0
      this.tagFocus()
    },
    // 点击提交
    clickPopoverSubmit(data) {
      this.tagData = {
        ...this.tagData,
        select: data
      }
      this.tagSubmit()
    },
    // 弹窗取消
    clickPopoverReset() {
      this.tagBlur()
    },
    // 显示弹窗
    showPopover() {
      const tagData = this.tagData
      this.popoverOption.isShow = this.data.select_type === 'select'
      this.popoverOption.isCheckBox = this.data.select_type === 'select'
      this.popoverOption.option = []
      this.popoverOption.option = tagData.data
      this.setPopoverPosition()
    },
    // 弹窗配置，
    setPopoverPosition() {
      this.$nextTick(() => {
        const tagData = this.tagData
        const marginLeft = tagData.title ? this.textWidth(`${tagData.title}：`) : 0
        const inputBoxParent = this.$refs.textarea.parentElement.parentElement.parentElement
        const inputBox = this.$refs.textarea
        const bodyWidth = document.body.offsetWidth
        const popoverWidth = document.querySelector('.popover_box').offsetWidth + marginLeft
        const offsetLeft = inputBoxParent.offsetLeft + inputBoxParent.offsetParent.offsetLeft
        const left = offsetLeft + popoverWidth < bodyWidth ? offsetLeft : bodyWidth - popoverWidth
        const top = inputBoxParent.offsetTop + inputBoxParent.offsetParent.offsetTop + inputBox.offsetTop + inputBox.offsetHeight
        this.popoverOption.marginLeft = marginLeft
        this.popoverOption.left = left
        this.popoverOption.top = top
      })
    },
    setInputWidth() {
      this.textareaOption.width = this.textWidth(this.textareaOption.value) + 21
    },
    // 删除
    delTag() {
      this.$emit('delTag', this.index)
    },
    textFilter(arr) {
      // console.log('searchTag---textFilter')
      var str = ''
      arr.map((item, index) => {
        str += index === 0 ? `${item.title}` : ` | ${item.title}`
      })
      return str
    }
  }
}
</script>

<style lang="less" scoped>
</style>
