# ruijie-school-network-auth-ssh

一个用于利用 SSH 与 cURL 在远程设备上登陆「锐捷网络」验证的脚本。

本脚本可用于远程在 OpenWRT 路由设备上模拟用户登陆网络。

## 使用

1. 克隆仓库，然后运行 `npm install`
2. 复制项目根目录的 `.env.example` 到 `.env`，然后填写环境文件内的配置
    * **注意：本脚本未做缺省值处理，所以请确保在运行脚本前填写好所有的配置参数！**
    1. SSH 连接配置
        * `SSH_HOST`: 想要远程连接的设备，例如 `192.168.31.1`
        * `SSH_PORT`: 远程设备的 SSH 端口号，默认为 `22`
        * `SSH_USERNAME`: 远程设备的用户名，例如 `root`
        * `SSH_PASSWORD`: 远程设备的密码，例如 `root`
    2. 网络登陆配置
        * `AUTH_ENTRY_URL`: 网关登陆页面的入口网址，一般访问这个网址会包含一段跳转到登陆页面的 JavaScript 代码
        * `AUTH_USERNAME`: 你的网络账号
        * `AUTH_PASSWORD`: 你的网络密码
        * `AUTH_SERVICE`: 你需要登陆的网络服务，这个值视每个网关的具体设置而定，例如 `校园网`
    3. 其他配置
        * `USER_AGENT`: 指定发送请求时使用的 User-Agent
3. 运行 `index.mjs`
4. 观察输出，如果没有问题的话，应该就登陆成功了

## 注意事项

* 本脚本目前只对我自己的学校做了适配，所以许多功能会缺失（例如打码、宽带账号密码登陆等），如果有需要欢迎自行修改后提交 PR。

## 鸣谢

* [node-ssh](https://www.npmjs.com/package/node-ssh)
* [dotenv](https://www.npmjs.com/package/dotenv)
* security.js *（备注：此文件一开始是面向浏览器的，且该文件代码十分老旧，本人在此稍作修改以能在 NodeJS 环境下运行，暂时未找到该文件的最初来源）*

## LICENSE
```
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
```