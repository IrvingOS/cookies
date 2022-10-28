/*
 * @Descripttion: js
 * @Version: 1.0
 * @Author: TimeChaser 1872101334@qq.com
 * @Date: 2022-10-27 16:28:29
 * @LastEditors: TimeChaser 1872101334@qq.com
 * @LastEditTime: 2022-10-27 20:18:42
 */
import * as React from 'react';
import Cookies from './Cookies';

const CookiesContext = React.createContext(new Cookies());

export const { Provider, Consumer } = CookiesContext;
export default CookiesContext;
