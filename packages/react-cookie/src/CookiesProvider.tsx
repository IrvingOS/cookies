/*
 * @Descripttion: js
 * @Version: 1.0
 * @Author: TimeChaser 1872101334@qq.com
 * @Date: 2022-10-27 16:28:29
 * @LastEditors: TimeChaser 1872101334@qq.com
 * @LastEditTime: 2022-10-27 20:38:47
 */
import * as React from 'react';
import Cookies from './Cookies';
import { ReactCookieProps } from './types';

import { Provider } from './CookiesContext';

export default class CookiesProvider extends React.Component<
  ReactCookieProps,
  any
> {
  cookies: Cookies;

  constructor(props: ReactCookieProps) {
    super(props);

    if (props.cookies) {
      this.cookies = props.cookies;
    } else {
      this.cookies = new Cookies();
    }
  }

  render() {
    // 创建 CookiesContext 作用域
    return <Provider value={this.cookies}>{this.props.children}</Provider>;
  }
}
