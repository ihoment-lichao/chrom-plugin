//深拷贝
export function deepClone (source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'shallowClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  for (const keys in source) {
    if (source.hasOwnProperty(keys)) {
      if (source[keys] && typeof source[keys] === 'object') {
        targetObj[keys] = source[keys].constructor === Array ? [] : {}
        targetObj[keys] = deepClone(source[keys])
      } else {
        targetObj[keys] = source[keys]
      }
    }
  }
  return targetObj
}
//获取区间随机整数
export function getRandNum (min = 3, max = 5) {
  let length = max - min + 1;
  return parseInt(Math.random() * (length) + min);
}
//8位随机id
export function generateRandomString (prefix = 'erp') {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var randomStr = '';
  for (let index = 0; index < 8; index++) {
    let randomNum = Math.floor(Math.random() * chars.length);
    randomStr += chars.substring(randomNum, randomNum + 1);
  }
  return prefix + '-' + randomStr;
}