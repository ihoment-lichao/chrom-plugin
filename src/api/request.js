import xhrFetch from './fetch.js'
import MUTATION from '../unit/mutation-types.js'
export function loginDemo (params) {
  return xhrFetch({
    url: MUTATION.DEV_LANGJING_ERP + '/user/rest/v2/login',
    method: 'post',
    data: params,
  })
}
export function requestPage (params) {
  return xhrFetch({
    url: 'https://sellercentral.amazon.com/home',
    method: 'get',
  })
}
export function getUrl (url) {
  if (url.indexOf("?") > -1) {
    url += "&"
  } else {
    url += "?"
  }
  url += "timestamp" + Date.now()
  return new Promise((resolve, reject) => {
    fetch(url, {
      method: 'get',
      headers: {
        "Cache-Control": "no-store"
      },
      mode: 'cors',
    }).then((res) => {
      if (res.status === 200) {
        resolve(res)
      } else {
        reject(res)
      }
    }).catch(error => {
      console.log('Fetch Error', error)
    })
  })
}


