class Cookie {
  constructor() {
    this.cookies = {};
    this.updateCookies();
  }

  updateCookies() {
    const cookiesStr = document.cookie;
    const list = cookiesStr.split('; ');
    for (const cookieData of list) {
      const [key, val] = cookieData.split('=');
      if (val) this.cookies[key] = val;
    }
  }

  get(name, fallback = null) {
    console.log('GET COOKIE', { name, value: this.cookies[name] || fallback });
    return this.cookies[name] || fallback;
  }

  getAll() {
    return this.cookies;
  }

  set(name, value) {
    console.log('SET COOKIE', { name, value });
    const now = new Date();
    now.setTime(now.getTime() + 30 * 60 * 1000);
    document.cookie = `${name}=${value};expirese=${now.toUTCString()};path=/`;
    this.updateCookies();
    return !!this.cookies[name];
  }

  reset() {
    console.log('RESET ALL COOKIES');
    const now = new Date();
    now.setTime(now.getTime() - 60 * 1000);
    for (const name in this.cookies) {
      document.cookie = `${name}=;expires=${now.toUTCString()};path=/`;
    }
  }
}

export default Cookie;
