import * as cookie from 'cookie';
import {
  Cookie,
  CookieChangeListener,
  CookieChangeOptions,
  CookieGetOptions,
  CookieParseOptions,
  CookieSetOptions
} from './types';
import { hasDocumentCookie, parseCookies, readCookie } from './utils';

export default class Cookies {
  private cookies: { [name: string]: Cookie };
  private changeListeners: CookieChangeListener[] = [];

  // 是否存在 DOM
  private HAS_DOCUMENT_COOKIE: boolean = false;

  constructor(cookies?: string | object | null, options?: CookieParseOptions) {
    this.cookies = parseCookies(cookies, options);

    // 为了捕获错误？
    new Promise(() => {
      this.HAS_DOCUMENT_COOKIE = hasDocumentCookie();
    }).catch(() => {});
  }

  // cookie 状态中不计算 cookie 是否过期以及是否被删除，只要存在 cookie 状态中的均是有效 cookie
  // 是否过期和是否被删除均由浏览器决定
  // 所以每次查询前都要从浏览器 document.cookie 来更新 cookie 状态
  // 但是，若浏览器不允许 cookie，则有 cookie 状态对 cookie 进行管理，但是这种 cookie 在用户关闭全部页面时删除
  private _updateBrowserValues(parseOptions?: CookieParseOptions) {
    // 浏览器不存在 cookie 功能或不允许 cookie？
    // 此时 cookie 由 cookie 状态进行管理
    if (!this.HAS_DOCUMENT_COOKIE) {
      return;
    }

    this.cookies = cookie.parse(document.cookie, parseOptions);
  }

  private _emitChange(params: CookieChangeOptions) {
    for (let i = 0; i < this.changeListeners.length; ++i) {
      this.changeListeners[i](params);
    }
  }

  // 重载方法共用函数体
  public get(name: string, options?: CookieGetOptions): any;
  public get<T>(name: string, options?: CookieGetOptions): T;
  public get(
    name: string,
    options: CookieGetOptions = {},
    parseOptions?: CookieParseOptions
  ) {
    // 更新浏览器状态
    this._updateBrowserValues(parseOptions);
    // 如需反序列化则进行相应的转换处理
    return readCookie(this.cookies[name], options);
  }

  public getAll(options?: CookieGetOptions): any;
  public getAll<T>(options?: CookieGetOptions): T;
  public getAll(
    options: CookieGetOptions = {},
    parseOptions?: CookieParseOptions
  ) {
    this._updateBrowserValues(parseOptions);
    const result: { [name: string]: any } = {};

    for (let name in this.cookies) {
      result[name] = readCookie(this.cookies[name], options);
    }

    return result;
  }

  public set(name: string, value: Cookie, options?: CookieSetOptions) {
    // 如果是 object 则进行 JSON 序列化操作
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }

    // 这里的更新看起来是没有多大必要的，因为每次查询的最终返回值还是由浏览器决定
    // 但是，若浏览器不存在 cookie 功能或不允许 cookie 时
    // 这里对 cookie 状态进行更新，从而实现阉割版（没有过期时间，退出则删除）cookie
    this.cookies = { ...this.cookies, [name]: value };

    // 浏览器 cookie 功能正常，序列化后更新浏览器 cookie
    if (this.HAS_DOCUMENT_COOKIE) {
      document.cookie = cookie.serialize(name, value, options);
    }

    this._emitChange({ name, value, options });
  }

  public remove(name: string, options?: CookieSetOptions) {
    const finalOptions = (options = {
      ...options,
      expires: new Date(1970, 1, 1, 0, 0, 1),
      maxAge: 0
    });

    // 更新 cookie 状态
    this.cookies = { ...this.cookies };
    delete this.cookies[name];

    // 浏览器 cookie 功能正常，序列化后更新浏览器 cookie
    if (this.HAS_DOCUMENT_COOKIE) {
      // document.cookie 没提供 delete 或 remove API
      // 所以通过将失效时间设为 1970，且 maxAge 设为 0 的方式来使得浏览器删除 cookie
      document.cookie = cookie.serialize(name, '', finalOptions);
    }

    this._emitChange({ name, value: undefined, options });
  }

  public addChangeListener(callback: CookieChangeListener) {
    this.changeListeners.push(callback);
  }

  public removeChangeListener(callback: CookieChangeListener) {
    const idx = this.changeListeners.indexOf(callback);
    if (idx >= 0) {
      this.changeListeners.splice(idx, 1);
    }
  }
}
