
console.info('background.js执行')
import fetchXhr from '../api/fetch.js'
import * as requestApi from '../api/request.js'
import { storeChromeData, getChromeData } from "../unit/localStore.js"
import { getRandNum, generateRandomString, deepClone } from "../unit/tool.js"

import xmldom from "xmldom"
import siteMap from '../unit/amzSiteMap.js'
var xmlDOMParser = xmldom.DOMParser;
var cookiedMarketList = []//包含cookie的站点url
var loginedMarketList = []//返回登陆信息的站点url
var merchantMarketplaces = []
var amzUserInfo = {}
var chromeUniId = ""
// 后台监听事件消息
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  let requestType = message.type;
  let reportType = message.reportType;
  switch (requestType) {
    case "researchEvt":
      if (reportType === 'Shipments') {
        startShipmentsPull(false, message.params.selectList, message.params.startTime, message.params.endTime)
      }
      sendResponse({ "researchEvt": true })
      break;
    case "resetTask":
      if (reportType === 'Shipments') {
        initShipmentsTask()
      }
      sendResponse({ "resetTask": true })
      break;
  }

});
chrome.runtime.onInstalled.addListener(function () {
  chrome.action.setBadgeBackgroundColor({ color: '#f6f7f9' })
  //生成8位唯一id
  generateUnid()
})
//获取本地登陆用户名
const getLocalAmzName = async () => {
  var amzName = amzUserInfo.name
  if (!amzName) {
    let resObj = await getChromeData('amzUserInfo')
    amzName = resObj && resObj.name ? resObj.name : '-'
  }
  return amzName
}
//获取本地插件unid
const getLocalChromeUniId = async () => {
  if (!chromeUniId) {
    let res = await getChromeData('chromeUniId')
    if (res)
      chromeUniId = res.chromeUniId
  }
  return chromeUniId
}
const generateUnid = () => {
  chromeUniId = generateRandomString()
  console.info('插件Unid：' + chromeUniId)
  storeChromeData({ 'chromeUniId': { chromeUniId } })
  chrome.runtime.sendMessage({ type: 'setChromeUniId', name: chromeUniId }, (res) => {
  })
}
//检测所有站点是否登陆
//auto是否后台自动调用
const startShipmentsPull = async (auto, selectSite, startTime, endTime) => {
  console.info(`startShipmentsPull执行时间：${new Date()}`)
  chromeUniId = await getLocalChromeUniId()
  var amzName = await getLocalAmzName()
  dingdingChormePush({
    title: '站点cookie查询',
    message: `【${chromeUniId}(${amzName})】(${auto ? '自动' : '手动'})执行startShipmentsPull方法`
  })
  let siteNameMap = siteMap.siteNameMap
  let siteToUrlMap = siteMap.siteToUrlMap
  let codeToSiteMap = siteMap.codeToSiteMap
  let marketUrlcookieMap = siteMap.marketUrlcookieMap
  let MarketplaceUrlMap = siteMap.MarketplaceUrlMap
  let tempUrlList = []
  let tempSiteList = []
  let cookieList = []
  //提取cookie站点集合
  for (const market in marketUrlcookieMap) {
    tempUrlList.push(marketUrlcookieMap[market])
  }
  //获取用户信息站点集合
  for (const site in siteNameMap) {
    tempSiteList.push(site)
  }
  let reslist = tempUrlList.map(async url => {
    return await Promise.all([getCookies({
      url: url, name: "at-main"
    }), getCookies({
      url: url, name: "at-acbit"
    }), getCookies({
      url: url, name: "at-acbuk"
    }), getCookies({
      url: url, name: "at-acbau"
    }), getCookies({
      url: url, name: "at-acbsg"
    }), getCookies({
      url: url, name: "at-acbjp"
    }), getCookies({
      url: 'https://www.amazon.com', name: "at-main"
    })])
  })
  let allList = await Promise.all(reslist).catch(error => {
    console(error.message)
  })
  allList.map(arr => {
    cookieList = cookieList.concat(arr)
  })
  //过滤有cookie的数据
  cookiedMarketList = cookieList.filter(item => {
    return item && item.value
  })
  if (cookiedMarketList.length > 0) {
    //存在cookie信息,遍历站点接口，获取有用户信息返回的站点url
    let accountRes = tempSiteList.map(url =>
      getAccounts(url + '/partner-dropdown/data/get-partner-accounts?stck=na', {
        delegationContext: '',
        pageSize: 10,
      })
    )
    let allSiteAccount = await Promise.all(accountRes).catch(error => {
      console.log(error.message)
    })
    console.info(`【${chromeUniId}】存在cookie信息的站点${allSiteAccount.length}个`)
    //过滤成功返回用户信息数据
    loginedMarketList = allSiteAccount.filter((obj, index) => {
      let isObj = (typeof obj === "object" && Object.keys(obj).length > 0)
      if (isObj) {
        obj.baseUrl = tempSiteList[index]
      }
      return isObj
    })
    if (loginedMarketList.length > 0) {
      console.info(`已登陆站点：${loginedMarketList.length}个`)
      //设置账户信息
      amzUserInfo = loginedMarketList[0].partnerAccounts[0] || {}
      chrome.action.setBadgeText({ text: '' })
      storeChromeData({ 'amzUserInfo': amzUserInfo })
      //获取站点列表
      getAccounts(
        loginedMarketList[0].baseUrl + "/partner-dropdown/data/get-merchant-marketplaces-for-partner-account", {
        delegationContext: "", partnerAccountId: amzUserInfo.id
      }).then(async res => {
        if (auto) {
          merchantMarketplaces = res.merchantMarketplaces || [];
          storeChromeData({ 'merchantMarketplaces': deepClone(merchantMarketplaces) })
        } else {
          merchantMarketplaces = selectSite
        }
        //提取请求成功区域站点的url
        var succeedInterfaceUrl = []
        for (const item of merchantMarketplaces) {
          let marketplaceId = item.marketplaceId
          let marketInterfaceUrl = MarketplaceUrlMap[marketplaceId]
          let baseWebUrl = `${marketInterfaceUrl}/home?mons_sel_dir_mcid=${item.directedId}&mons_sel_mkid=${marketplaceId}&mons_sel_dir_paid=${amzUserInfo.directedId}`
          //拼接切换站点webUrl
          let marketWebUrl = `${baseWebUrl}&timestamp=${Date.now()}`
          const homeHtml = await changeMarketSite(marketWebUrl, marketInterfaceUrl, marketplaceId)
          //请求成的站点url
          if (homeHtml) {
            succeedInterfaceUrl.push(marketInterfaceUrl)
          }
        }
        console.info(`【${chromeUniId}】成功打开相同区域站点${succeedInterfaceUrl.length}个`)
        //执行任务
        for (const item of merchantMarketplaces) {
          let marketplaceId = item.marketplaceId
          var marketInterfaceUrl = MarketplaceUrlMap[marketplaceId]
          console.info(`当前执行站点： ${marketInterfaceUrl}`)
          //判断当前站点url是否存在请求成功区域站点的url集合,不是则表示失败url，实用用同区域站点url替换进行请求
          if (!(succeedInterfaceUrl.indexOf(marketInterfaceUrl) > -1)) {
            console.info(`站点执行失败： ${marketInterfaceUrl}`)
            let siteName = siteNameMap[marketInterfaceUrl] //站点url所属区域
            let siteUrls = siteToUrlMap[siteName] //区域下所有站点url集合
            //找出同区域成功的站点url
            var brotherSiteUrl = succeedInterfaceUrl.find(num => {
              return siteUrls.includes(num)
            })
            if (brotherSiteUrl) {
              marketInterfaceUrl = brotherSiteUrl
              console.info(`执行同区域站点： ${brotherSiteUrl}`)
            } else {
              console.info('执行站点同区域无站点')
            }
          }
          var baseWebUrl = `${marketInterfaceUrl}/home?mons_sel_dir_mcid=${item.directedId}&mons_sel_mkid=${marketplaceId}&mons_sel_dir_paid=${amzUserInfo.directedId}`
          //拼接切换站点webUrl
          var marketWebUrl = `${baseWebUrl}&timestamp=${Date.now()}`
          const homeHtml = await changeMarketSite(marketWebUrl, marketInterfaceUrl, marketplaceId)
          //同步切换站点成功
          if (homeHtml) {
            console.info(`【${chromeUniId}】站点[${marketplaceId}]切换成功`)
            //判断站点是否成功
            const marketHtml = await getCurrentMarket(marketInterfaceUrl)
            if (marketHtml) {
              var domParser = new xmlDOMParser();
              var domObj = domParser.parseFromString(marketHtml, "text/html")
              var selectDom = domObj && domObj.getElementById('partner-switcher')
              if (selectDom) {
                var partnerCode = selectDom.getAttribute("data-partner_selection")//账号id
                var marketCode = selectDom.getAttribute("data-marketplace_selection")//当前前站点id
                if (marketplaceId === marketCode) {
                  console.info(`切换站点成功：${marketplaceId}`)
                  //检测语言是否为英文？是(执行业务代码)：否（手动切换英文，检测是否切换成功,再执行业务代码）
                  if (marketHtml && checkLanguageFromHtml(homeHtml)) {
                    let doNum = false
                    let reportList = []
                    let lastData = null
                    do {
                      reportList = await getShipmentReport(marketInterfaceUrl, lastData, startTime, endTime)
                      if (reportList && reportList.length) {
                        console.info(`站点[${marketplaceId}]获取shipmentReport成功！`)
                        dingdingChormePush({
                          title: '站点推送',
                          message: `【${chromeUniId}(${amzUserInfo.name})】站点[${marketplaceId}]拉取数据完成！`
                        })
                        if (reportList.length == 100) {
                          doNum = true
                          lastData = reportList[99]
                        } else {
                          doNum = false
                          lastData = null
                        }
                        let resData = await uploadDataToErp(reportList, marketplaceId)
                      } else {
                        dingdingChormePush({
                          title: '拉取失败',
                          message: `【${chromeUniId}(${amzUserInfo.name})】站点[${marketplaceId}]数据为空或请求异常！`
                        })
                        doNum = false
                      }
                    } while (doNum);
                  } else {
                    //获取站点可用语言列表,查找en_后嘴code码
                    let enLocateCode = `en_${codeToSiteMap[marketplaceId]}`
                    let localesData = await getMarketAbleLocales(marketInterfaceUrl)
                    let findItem = localesData.locales.find(item => {
                      if (item.code) {
                        return item.code.includes("en")
                      } else {
                        return false
                      }
                    })
                    if (findItem) {
                      enLocateCode = findItem.code
                    }
                    //拼接切换语言webUrl
                    let languageWebUrl = `${baseWebUrl}&mons_sel_locale=${enLocateCode}&timestamp=${Date.now()}`
                    const homeLanguageHtml = await changeMarketSite(languageWebUrl, marketInterfaceUrl, marketplaceId)
                    if (homeLanguageHtml && checkLanguageFromHtml(homeLanguageHtml)) {
                      console.info(`站点[${marketplaceId}]获取shipmentReport成功！`)
                      //执行业务代码
                      let doNum = false
                      let reportList = []
                      let lastData = null
                      do {
                        reportList = await getShipmentReport(marketInterfaceUrl, lastData, startTime, endTime)
                        if (reportList && reportList.length) {
                          dingdingChormePush({
                            title: '站点推送',
                            message: `【${chromeUniId}(${amzUserInfo.name})】站点[${marketplaceId}]拉取数据完成！`
                          })
                          if (reportList.length == 100) {
                            doNum = true
                            lastData = reportList[99]
                          } else {
                            doNum = false
                            lastData = null
                          }
                          let resData = await uploadDataToErp(reportList, marketplaceId)
                        } else {
                          dingdingChormePush({
                            title: '拉取失败',
                            message: `【${chromeUniId}(${amzUserInfo.name})】站点[${marketplaceId}]数据为空或请求异常！`
                          })
                          doNum = false
                        }
                      } while (doNum);
                    }
                  }
                }
                //发送消息到pupop页面
                chrome.runtime.sendMessage({ type: 'setMarketName', name: marketCode }, (res) => {
                  storeChromeData({ partnerCode })
                  storeChromeData({ marketCode })
                })
              } else {
                dingdingChormePush({
                  title: '站点异常',
                  message: `[${marketplaceId}]获取语言失败，option结构或属性已变更！`
                })
              }
            } else {
              //切换站点失败
              marketExceptionMessge(marketWebUrl)
            }
          } else {
            marketExceptionMessge(marketWebUrl)
          }
        }
        console.info(`所有站点执行完成`)
      })
      chrome.runtime.sendMessage({ type: 'setAmzUserInfo', name: amzUserInfo.name || '' }, (res) => { })
    } else {
      //不存在账户信息站点url，提示未登录
      console.info(`当前不存在登录站点`)
      noLoginMessge()
    }
  } else {
    //没有cookie信息，提示未登录
    console.info(`当前不存在登录站点`)
    noLoginMessge()
  }
}
//获取当前站点
const getCurrentMarket = async (marketInterfaceUrl) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let url = `${marketInterfaceUrl}/trim/component/partner-dropdown?timestamp=${Date.now()}`
      fetch(url, {
        method: 'get',
        headers: {
          "Cache-Control": "no-store"
        },
        mode: 'no-cors',
      }).then((res) => {
        if (res.status === 200 && !res.redirected) {
          resolve(res.text())
        } else {
          resolve(null)
        }
      }).catch(error => {
        console.log(error.message)
        resolve(null)
      })
    })
  }, getRandNum() * 1000);
}
//获取当前站点可用语言，过滤en_后缀的code编码
const getMarketAbleLocales = (marketInterfaceUrl) => {
  return new Promise((resolve, reject) => {
    fetch(`${marketInterfaceUrl}/trim/get-available-locales`, {
      method: 'get',
      headers: {
        "Cache-Control": "no-store"
      },
      mode: 'no-cors',
    }).then((res) => {
      if (res.status === 200 && !res.redirected) {
        resolve(res.json())
      } else {
        resolve(null)
      }
    }).catch(error => {
      console.log(error.message)
      resolve(null)
    })
  })
}

//后台切换站点
const changeMarketSite = async (marketWebUrl) => {
  //标准url
  // marketWebUrl = 'https://sellercentral.amazon.it/home?mons_sel_dir_mcid=amzn1.merchant.d.ABK5ORUAEQ55BANRWPKAVMBERVHQ&mons_sel_mkid=APJ6JRA9NG5V4&mons_sel_dir_paid=amzn1.pa.d.ABTF2DOYBGGSJCERPHIF6L6CQVHQ&timestamp=1692685667809'
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fetch(marketWebUrl, {
        method: 'get',
        headers: {
          "Cache-Control": "no-store"
        },
        mode: 'no-cors',
      }).then((res) => {
        if (res.status === 200 && !res.redirected) {
          resolve(res.text())
        } else {
          resolve(null)
        }
      }).catch(error => {
        console.log(error.message)
        resolve(null)
      })
    }, getRandNum() * 1000);
  })
}
//分页拉去报告数据
const getShipmentReport = (marketInterfaceUrl, lastData, startTime, endTime) => {
  let dayTimes = 24 * 60 * 60 * 1000//一天毫秒数
  let pageSize = 100
  let isOrderAscending = false
  let orderBy = 'SHIPMENT_UPDATE_DATE'
  //开始结束时间
  if (!startTime || !endTime) {
    var dateObj = new Date()
    startTime = dateObj.getTime() - 3 * dayTimes
    endTime = dateObj.getTime()
  }
  let shipmentWebUrl = `${marketInterfaceUrl}/fba/shippingqueue/api/v1/shipment/listShipments?pageSize=${pageSize}&startTime=${startTime}&endTime=${endTime}&orderBy=${orderBy}&isOrderAscending=${isOrderAscending}&t2pLaunched=true`
  if (lastData && lastData.shipmentId) {
    shipmentWebUrl = shipmentWebUrl + '&lastShipmentId=' + lastData.shipmentId +
      '&createdDate=' + lastData.createdDate + '&lastUpdatedDate=' + lastData.lastUpdatedDate
    console.log('执行分页url：' + shipmentWebUrl)
  }
  // https://sellercentral.amazon.com/fba/shippingqueue/api/v1/shipment/listShipments?pageSize=26&&startTime=1691683200000&endTime=1692287999000&&orderBy=SHIPMENT_UPDATE_DATE&isOrderAscending=false&lastData=FBA178FVPMMW&createdDate=1687833305000&lastUpdatedDate=1691779978000&t2pLaunched=true
  return new Promise((resolve, reject) => {
    fetch(shipmentWebUrl, {
      method: 'get',
      headers: {
        "Cache-Control": "no-store"
      },
      mode: 'no-cors',
    }).then((res) => {
      if (res.status === 200 && !res.redirected) {
        resolve(res.json())
      } else {
        resolve(null)
      }
    }).catch(error => {
      console.log(error.message)
      resolve(null)
    })
  })
}
//拉取成功上传erp后台
const uploadDataToErp = async (list, marketplaceId) => {
  chromeUniId = await getLocalChromeUniId()
  var amzName = await getLocalAmzName()
  let parasArr = []
  list.forEach(item => {
    let shipmentItem = {
      shipmentId: item.shipmentId, referenceId: item.poId
    }
    if (item.shipOrDeliveryWindow && item.shipOrDeliveryWindow.windowStartDate) {
      shipmentItem.windowStartDate = item.shipOrDeliveryWindow.windowStartDate
    }
    if (item.shipOrDeliveryWindow && item.shipOrDeliveryWindow.windowEndDate) {
      shipmentItem.windowEndDate = item.shipOrDeliveryWindow.windowEndDate
    }
    parasArr.push(shipmentItem)
  });
  return new Promise((resolve, reject) => {
    fetch('https://backend.lanjingerp.com/ms-ai-sales/rest/v2/shipments/saveImportData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(parasArr),
    }).then((res) => {
      if (res.status === 200 && !res.redirected) {
        dingdingChormePush({
          title: '上传成功',
          message: `【${chromeUniId}(${amzName})】站点[${marketplaceId}]数据上传成功！`
        })
        resolve(res.json())
      } else {
        dingdingChormePush({
          title: '上传失败',
          message: `【${chromeUniId}(${amzName})】站点[${marketplaceId}]数据上传失败！`
        })
        resolve({})
      }
    }).catch(error => {
      console.log(error.message)
      dingdingChormePush({
        title: '上传失败',
        message: `【${chromeUniId}(${amzName})】站点[${marketplaceId}]数据上传失败！`
      })
      resolve({})
    })
  })
}
//根据站点url切换检测语言
const checkLanguageFromHtml = async (htmlStr) => {
  var domParser = new xmlDOMParser();
  var defaultLanguage = "";
  let domObj = domParser.parseFromString(htmlStr, "text/html")
  var optionNodeList = domObj.getElementsByTagName('option')
  for (let index = 0; index < optionNodeList.length; index++) {
    let nodeItem = optionNodeList[index]
    if (nodeItem.attributes.length >= 2) {
      defaultLanguage = nodeItem.attributes[0].value
      break
    }
  }
  //是否存在当前语言
  if (defaultLanguage) {
    chrome.runtime.sendMessage({ type: 'setLanguage', name: defaultLanguage }, (res) => {
      storeChromeData({ 'currentLanguage': defaultLanguage })
    })
    let lowerCase = defaultLanguage.toLowerCase()
    //存在检测是否为英文
    if (lowerCase.indexOf('en') > -1) {
      return true
    } else {
      return false
    }
  } else {
    chromeUniId = await getLocalChromeUniId()
    var amzName = await getLocalAmzName()
    dingdingChormePush({
      title: '站点异常',
      message: `【${chromeUniId}(${amzName})】获取站点语言失败，option结构或属性已变更`
    })
    return false
  }
}
//获取站点异常信息提示
const marketExceptionMessge = async (url) => {
  let host = url.split("?")[0]
  chromeUniId = await getLocalChromeUniId()
  var amzName = await getLocalAmzName()
  dingdingChormePush({
    title: '站点异常',
    message: `【${chromeUniId}(${amzName})】站点异常，请登陆查看${host}`
  })
}
//检测未登录设置离线状态、浏览器通知
const noLoginMessge = async () => {
  chrome.action.setBadgeText({ text: '离线' })
  chromeUniId = await getLocalChromeUniId()
  var amzName = await getLocalAmzName()
  dingdingChormePush({
    type: 'login',
    title: '插件通知',
    message: `【${chromeUniId}(${amzName})】登陆失效，请重新登陆亚马逊卖家中心！`
  })
}
//发送浏览器通知、推送叮叮
const dingdingChormePush = (params) => {
  if (params.type && params.type === 'login') {
    const notificatImgUrl = chrome.runtime.getURL("img/logo-34.png");
    chrome.notifications.create(null, {
      type: 'basic',
      iconUrl: notificatImgUrl,
      title: params.title,
      message: params.message
    });
  }
  const dingdingTalkUrl = 'https://oapi.dingtalk.com/robot/send?access_token=1ba3cfa92e9983ea6b380b518307370706c73ec410e0782db08f8dd8fd559d24'
  //推送叮叮群
  let dingdingParams = {
    msgtype: "markdown",
    markdown: {
      title: params.title,
      text: params.message
    }
  }
  fetch(dingdingTalkUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    body: JSON.stringify(dingdingParams),
  })
}
//获取网站cookies
const getCookies = (params) => {
  if (params && params.url && params.name)
    return new Promise(function (resolve) {
      chrome.cookies.get(params, function (data) {
        resolve(data)
      })
    })
}
//获取账户信息
const getAccounts = (url, params) => {
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(params),
    }).then((res) => {
      if (res.status === 200 && !res.redirected) {
        resolve(res.json())
      } else {
        resolve({})
      }
    }).catch(error => {
      console.log(error.message)
      resolve({})
    })
  })
}
const initShipmentsTask = () => {
  chrome.alarms.create("shipmentsTask", {
    delayInMinutes: 60 * 3,//延迟多久执行
    periodInMinutes: 60 * 6//多久执行一次
  })
  chrome.alarms.onAlarm.addListener(async function (alarm) {
    if (alarm.name === 'shipmentsTask') {
      chromeUniId = await getLocalChromeUniId()
      var amzName = await getLocalAmzName()
      dingdingChormePush({
        title: '定时任务',
        message: `【${chromeUniId}(${amzName})】定时任务执行时间：${new Date()}`
      })
      startShipmentsPull(true)
    }
  })
}
//调用入口
startShipmentsPull(true)
//创建后台定时器任务
initShipmentsTask()
export { getCookies, getAccounts, startShipmentsPull, initShipmentsTask, dingdingChormePush, marketExceptionMessge, noLoginMessge, checkLanguageFromHtml, getLocalAmzName, getLocalChromeUniId }
