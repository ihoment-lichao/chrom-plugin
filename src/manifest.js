import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: '蓝鲸ERP浏览器报表插件',
  description: '一款亚马逊表报拉取插件',
  version: '1.0.0',
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  externally_connectable: {
    "matches": [
      "*://*.amazon.com/*"
    ]
  },
  //插件设置页
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.js',
    type: 'module',
    persistent: true
  },
  host_permissions: ['<all_urls>'],
  //那些页面
  content_scripts: [
    {
      matches: [
        'https://sellercentral.amazon.com/*',
        'https://sellercentral.amazon.co.uk/*',
        'https://sellercentral-japan.amazon.com/*',
        'https://sellercentral.amazon.ca/*',
        'https://sellercentral.amazon.de/*',
        'https://sellercentral.amazon.fr/*',
        'https://sellercentral.amazon.it/*',
        'https://sellercentral.amazon.es/*',
        'https://sellercentral.amazon.com.mx/*',
        'https://sellercentral.amazon.in/*',
        'https://sellercentral.amazon.cn/*',
        'https://sellercentral.amazon.com.au/*',
        'https://apac.account.amazon.com/ap/*',
        'https://na.account.amazon.com/ap/*',
        'https://eu.account.amazon.com/ap/*',
        'https://sellercentral-europe.amazon.com/*',
        'https://sellercentral.amazon.co.jp/*',
        'https://sellercentral.amazon.nl/*',
        'https://sellercentral.amazon.ae/*',
        'https://sellercentral.amazon.sa/*',
        'https://sellercentral.amazon.se/*',
        'https://sellercentral.amazon.sg/*',
        'https://sellercentral.amazon.com.br/*',
        'https://sellercentral.amazon.com.be/*',
        'https://advertising.amazon.com/*',
        'https://advertising.amazon.sg/*',
        'https://advertising.amazon.sa/*',
        'https://advertising.amazon.pl/*',
        'https://advertising.amazon.ae/*',
        'https://advertising.amazon.com.au/*',
        'https://advertising.amazon.com.br/*',
        'https://advertising.amazon.ca/*',
        'https://advertising.amazon.de/*',
        'https://advertising.amazon.es/*',
        'https://advertising.amazon.fr/*',
        'https://advertising.amazon.in/*',
        'https://advertising.amazon.it/*',
        'https://advertising.amazon.nl/*',
        'https://advertising.amazon.com.mx/*',
        'https://advertising.amazon.co.uk/*',
        'https://advertising.amazon.co.jp/*',
        'https://advertising.amazon.se/*',
        'https://advertising.amazon.com.tr/*',
        'https://advertising.amazon.eg/*',
        'https://advertising.amazon.com.be/*',
        'https://*.amazonaws.com/*',
      ],
      js: ['src/content/index.js'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png',],
      matches: [],
    },
  ],
  permissions: [
    'notifications',
    'declarativeContent',
    'storage',
    'tabs',
    'history',
    'background',
    'alarms',
    'webRequest',
    'webRequestBlocking',
    'activeTab',
    'cookies',
    'action',
    'https://sellercentral.amazon.com/*',
    'https://sellercentral.amazon.co.uk/*',
    'https://sellercentral-japan.amazon.com/*',
    'https://sellercentral.amazon.ca/*',
    'https://sellercentral.amazon.de/*',
    'https://sellercentral.amazon.fr/*',
    'https://sellercentral.amazon.it/*',
    'https://sellercentral.amazon.es/*',
    'https://sellercentral.amazon.com.mx/*',
    'https://sellercentral.amazon.in/*',
    'https://sellercentral.amazon.cn/*',
    'https://sellercentral.amazon.com.au/*',
    'https://apac.account.amazon.com/ap/*',
    'https://na.account.amazon.com/ap/*',
    'https://eu.account.amazon.com/ap/*',
    'https://sellercentral-europe.amazon.com/*',
    'https://sellercentral.amazon.co.jp/*',
    'https://sellercentral.amazon.nl/*',
    'https://sellercentral.amazon.ae/*',
    'https://sellercentral.amazon.sa/*',
    'https://sellercentral.amazon.se/*',
    'https://sellercentral.amazon.sg/*',
    'https://sellercentral.amazon.com.br/*',
    'https://sellercentral.amazon.com.be/*',
    'https://*.amazonaws.com/*',
    'https://www.amazon.com/*',
    'https://www.amazon.ca/*',
    'https://www.amazon.com.mx/*',
    'https://www.amazon.com.br/*',
    'https://www.amazon.co.uk/*',
    'https://www.amazon.de/*',
    'https://www.amazon.es/*',
    'https://www.amazon.it/*',
    'https://www.amazon.fr/*',
    'https://www.amazon.nl/*',
    'https://www.amazon.se/*',
    'https://www.amazon.in/*',
    'https://www.amazon.ae/*',
    'https://www.amazon.sa/*',
    'https://www.amazon.pl/*',
    'https://www.amazon.com.tr/*',
    'https://www.amazon.sg/*',
    'https://www.amazon.co.jp/*',
    'https://www.amazon.com.au/*',
    'https://advertising.amazon.com/*',
    'https://advertising.amazon.sg/*',
    'https://advertising.amazon.sa/*',
    'https://advertising.amazon.pl/*',
    'https://advertising.amazon.ae/*',
    'https://advertising.amazon.com.au/*',
    'https://advertising.amazon.com.br/*',
    'https://advertising.amazon.ca/*',
    'https://advertising.amazon.de/*',
    'https://advertising.amazon.es/*',
    'https://advertising.amazon.fr/*',
    'https://advertising.amazon.in/*',
    'https://advertising.amazon.it/*',
    'https://advertising.amazon.nl/*',
    'https://advertising.amazon.com.mx/*',
    'https://advertising.amazon.co.uk/*',
    'https://advertising.amazon.co.jp/*',
    'https://advertising.amazon.se/*',
    'https://advertising.amazon.com.tr/*',
    'https://advertising.amazon.eg/*',
    'https://advertising.amazon.com.be/*',
  ],
})