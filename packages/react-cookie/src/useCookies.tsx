import { useContext, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { Cookie, CookieSetOptions } from 'universal-cookie';
import CookiesContext from './CookiesContext';
import { isInBrowser } from './utils';

export default function useCookies<T extends string, U = { [K in T]?: any }>(
  dependencies?: T[]
): [
  U,
  (name: T, value: Cookie, options?: CookieSetOptions) => void,
  (name: T, options?: CookieSetOptions) => void
] {
  // 使用 useCookies 函数的组件必须是 CookiesProvider 的子组件，否则上下文中拿不到 CookiesContext
  const cookies = useContext(CookiesContext);
  if (!cookies) {
    throw new Error('Missing <CookiesProvider>');
  }

  // 获取初始化的全部 Cookie
  const initialCookies = cookies.getAll();
  // 以初始化的 Cookie 为初值进行状态管理
  const [allCookies, setCookies] = useState(initialCookies);
  // 使用 ref 管理 allCookies，使其值保证修改前最新，且不会触发渲染
  const previousCookiesRef = useRef(allCookies);

  // 判断是否在浏览器中访问，浏览器才有 Cookie
  if (isInBrowser()) {
    // 同步调用，useLayoutEffect() 在页面刷新之后同步执行，useEffect() 在页面刷新时异步执行
    // 同时，在 cookies 变化时触发重新渲染
    useLayoutEffect(() => {
      // Cookie 变化时的监听函数
      function onChange() {
        // 拿到最新的 Cookie
        const newCookies = cookies.getAll();

        // 判断是否需要更新，因为一次更新意味着一次渲染
        if (
          shouldUpdate(
            dependencies || null,
            newCookies,
            previousCookiesRef.current
          )
        ) {
          // 修改状态管理，触发重新渲染
          setCookies(newCookies);
        }

        // setCookies 将会触发一次渲染，如果 previousCookiesRef 也作为状态管理的话将会再次触发渲染
        // 所以用的是 ref
        previousCookiesRef.current = newCookies;
      }
      // 挂载组件时添加监听器
      cookies.addChangeListener(onChange);

      // 卸载组件时删除监听器
      return () => {
        cookies.removeChangeListener(onChange);
      };
    }, [cookies]);
  }

  // cookie 由这两个函数进行修改，修改后触发上面在页面加载后添加的监听函数
  // useMemo 是为了只在 cookies 对象被重新赋值时进行绑定，即 CookiesContext 不变就不会重新绑定
  const setCookie = useMemo(() => cookies.set.bind(cookies), [cookies]);
  const removeCookie = useMemo(() => cookies.remove.bind(cookies), [cookies]);

  return [allCookies, setCookie, removeCookie];
}

function shouldUpdate<U = { [K: string]: any }>(
  dependencies: Array<keyof U> | null,
  newCookies: U,
  oldCookies: U
) {
  // 原 cookies 中不存在缓存行，所以 onChange 函数触发时 cookies 的内容必不同于之前
  if (!dependencies) {
    return true;
  }
  // 比较 dependencies 中各缓存行是否发生变更
  for (let dependency of dependencies) {
    if (newCookies[dependency] !== oldCookies[dependency]) {
      return true;
    }
  }

  return false;
}
