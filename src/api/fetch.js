import qs from 'qs'
import axios from 'axios'
const service = axios.create({
  baseURL: '',
  timeout: 300000, // 请求超时时间
})

service.interceptors.request.use(
  (config) => {
    // let token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    //   config.headers.originFrom = 'erp'
    // }

    if (config.method.match(/get|delete/)) {
      config.paramsSerializer = {
        serialize: (params) => {
          return qs.stringify(params, { indices: false })
        },
      }
    }
    return config
  },
  (err) => {
    return Promise.reject(err)
  },
)
// http response 拦截器
service.interceptors.response.use(
  (response) => {
    return  Promise.resolve(response)
  },
  (error) => {
    if (error.response) {
      // switch (error.response.status) {
        // case 401:
          // localStorage.removeItem('token')
          // break
        // case 403:
        //   ElMessage.error({
        //     message: '账号或密码错误',
        //     duration: 1000,
        //   })
        //   break
        // case 404:
        //   ElMessage.error({
        //     message: '无法链接',
        //     duration: 1000,
        //   })
        //   break
        // case 500:
        //   ElMessage.error({
        //     message: '服务器内部错误',
        //     duration: 1000,
        //   })
        //   break
        // case 504:
        //   ElMessage.error({
        //     message: '请求超时',
        //     duration: 1000,
        //   })
        //   break
      // }
    }
    return Promise.reject(error)
  },
)

export default service
