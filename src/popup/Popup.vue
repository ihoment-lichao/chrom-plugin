<script setup>
//引入依赖
import { ref } from 'vue'
import * as requestApi from '../api/request.js'
import * as backgroundApi from '../background/index.js'
import { storeChromeData, getChromeData } from '../unit/localStore.js'
import siteMap from '../unit/amzSiteMap'
import { deepClone } from '../unit/tool.js'
//定义数据
const crx = ref('create-chrome-ext')
var backGround = ref(null)
var userName = ref('-')
var marketNameList = ref([])
var version = ref('1.0.0')
var currentMarket = ref('-')
var currentLanguage = ref('-')
var chromeUniId = ref('')
var selectList = ref([])
var existSiteList = ref([])
var datePickerList = ref([])
var reportType = ref('Shipments')
var reportList = ref([
  {
    label: 'Shipments',
    value: 'Shipments',
  },
])

//定义函数
const closePopup = () => {
  window.close()
}
const siteChange = (valList) => {
  storeChromeData({ selectList: valList })
}
const dateChange = () => {
  storeChromeData({ datePickerList: [datePickerList.value[0], datePickerList.value[1]] })
}
const restartTask = () => {
  chrome.runtime.sendMessage({ type: 'resetTask', reportType: reportType.value }, (response) => {
    if (response && response.hasOwnProperty('resetTask') && response.resetTask) {
      alert('后台定时器任务重启成功，请勿重复启动！')
    } else {
      backgroundApi.initShipmentsTask()
    }
  })
}
//手动查询
const researchHandle = () => {
  // 处理参数
  let params = {
    startTime: null,
    endTime: null,
    selectList: [],
  }
  let arrList = []
  if (selectList.value && selectList.value.length) {
    existSiteList.forEach((item) => {
      if (selectList.value.includes(item.marketplaceId)) {
        arrList.push(item)
      }
    })
    params.selectList = arrList
  } else {
    alert('请先选择站点!')
    return
  }
  if (datePickerList.value && datePickerList.value.length) {
    let startTime = new Date(datePickerList.value[0] + ' 00:00:00').getTime()
    let endTime = new Date(datePickerList.value[1] + ' 23:59:59').getTime()
    params.startTime = startTime
    params.endTime = endTime
  }
  chrome.runtime.sendMessage(
    { type: 'researchEvt', reportType: reportType.value, params },
    (response) => {
      if (response && response.hasOwnProperty('researchEvt') && response.researchEvt) {
      } else {
        backgroundApi.startShipmentsPull(false, params.selectList, params.startTime, params.endTime)
      }
    },
  )
}
const initChormeWindow = async () => {
  getChromeData('amzUserInfo').then((res) => {
    if (res) userName.value = res.name || '-'
  })
  getChromeData('chromeUniId').then((res) => {
    chromeUniId.value = res || '-'
  })
  getChromeData('marketCode').then((res) => {
    currentMarket.value = res || '-'
  })
  getChromeData('currentLanguage').then((res) => {
    currentLanguage.value = res || '-'
  })
  getChromeData('merchantMarketplaces').then((list) => {
    if (list && list.length) {
      var tempMarketList = []
      existSiteList = []
      list.forEach((item) => {
        //站点集合
        let maketCode = siteMap.countryIdsMap[item.marketplaceId]
        if (maketCode) {
          tempMarketList.push(siteMap.countryMap[maketCode])
        }
        //站点列表，下拉用
        let tempObj = deepClone(item)
        tempObj.disabled = false
        tempObj.name = siteMap.codeToSiteMap[item.marketplaceId]
        existSiteList.push(tempObj)
      })
      marketNameList.value = new Set(tempMarketList)
      getChromeData('selectList').then((value) => {
        selectList.value = value || []
      })
      getChromeData('datePickerList').then((value) => {
        datePickerList.value = value || []
      })
    }
  })
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let requestType = message.type
  switch (requestType) {
    case 'setChromeUniId':
      // 设置惟一id
      chromeUniId.value = message.name
      sendResponse({ setChromeUniId: true })
      break
    case 'setAmzUserInfo':
      // 设置用户名
      userName.value = message.name || ''
      sendResponse({ setAmzUserInfo: true })
      break
    case 'setMarketName':
      // 设置当前执行站点
      currentMarket.value = siteMap.countryIdsMap[message.name]
      sendResponse({ setMarketName: true })
      break
    case 'setLanguage':
      // 设置当前语言
      currentLanguage.value = message.name
      sendResponse({ setLanguage: true })
      break
  }
})
window.onload = function () {
  initChormeWindow()
}
// const loginAction = (params) => {
//   requestApi
//     .loginDemo({
//       loginName: 'chao.li',
//       password: 'qaz12345',
//     })
//     .then((res) => {
//       if (res.status === 200) {
//         alert('登陆成功')
//       }
//     })
// }
</script>

<template>
  <main class="popup-main">
    <!-- <el-button size="small" type="primary" @click="loginAction">登陆</el-button> -->
    <!-- 用户信息 -->
    <div class="header">
      <span>用户名：{{ userName || '-' }}</span>
      <span class="close-icon" @click="closePopup">X</span>
    </div>
    <div class="content" style="flex: 1">
      <div class="lang">语言：{{ currentLanguage }}</div>
      <div class="site">
        检测在线站点：
        <span v-for="site in marketNameList" :key="site">{{ site }},</span>
      </div>
      <div class="currnet">当前执行站点：{{ currentMarket }}</div>
      <div class="search-content mg-top-12">
        <div class="mg-top-12">
          <span>报告类型：</span>
          <el-select v-model="reportType" size="small">
            <el-option
              v-for="item in reportList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div class="mg-top-12">
          <span>选择站点：</span>
          <el-select
            @change="siteChange"
            v-model="selectList"
            multiple
            size="small"
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择站点"
            style="width: 240px"
          >
            <el-option
              v-for="item in existSiteList"
              :key="item.marketplaceId"
              :label="item.name"
              :value="item.marketplaceId"
              :disabled="item.disabled"
            />
          </el-select>
        </div>
        <div class="mg-top-12">
          <span>选择时间：</span>
          <el-date-picker
            clearable
            style="width: 240px"
            v-model="datePickerList"
            type="daterange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="small"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="dateChange"
          />
        </div>
        <div class="search-btn mg-top-12">
          <el-button size="small" type="primary" @click="researchHandle">前端按条件执行</el-button>
        </div>
      </div>
    </div>
    <div class="footer">
      <span class="version">版本号：{{ version }}</span>
      <span class="unid mg-left">ID：{{ chromeUniId }}</span>
      <el-button class="mg-left" size="small" type="primary" @click="restartTask"
        >后台定时器重启</el-button
      >
    </div>
  </main>
</template>

<style>
.popup-main {
  padding: 0.6em;
  margin: 0 auto;
  width: 400px;
  line-height: 1.6em;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}
.search-content {
  margin-top: 10px;
}
.mg-top-12 {
  margin-top: 12px;
}
.search-btn {
  width: 100%;
  text-align: center;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.close-icon {
  cursor: pointer;
}
.mg-left {
  margin-left: 1.2em;
}
.footer {
  color: #888;
}
</style>
