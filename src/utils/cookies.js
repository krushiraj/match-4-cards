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
    document.cookie = `${name}=${value};max-age=${
      Date.now() + 86400000
    };path=/`;
    this.updateCookies();
    return !!this.cookies[name];
  }

  reset() {
    console.log('RESET ALL COOKIES');
    for (const name in this.cookies) {
      document.cookie = `${name}=;max-age=${Date.now() - 100};path=/`;
    }
  }
}

export default Cookie;
