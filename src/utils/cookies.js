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

  get(name, fallback = '') {
    console.log('GET COOKIE', { name, value: this.cookies[name] || fallback });
    return this.cookies[name] || fallback;
  }

  getAll() {
    this.updateCookies();
    return this.cookies;
  }

  set(name, value) {
    console.log('SET COOKIE', { name, value });
    document.cookie = `${name}=${value};max-age=3600;path=/`;
    this.updateCookies();
    return !!this.cookies[name];
  }

  reset() {
    console.log('RESET ALL COOKIES');
    for (const name in this.cookies) {
      document.cookie = `${name}=;max-age=-1;path=/`;
      this.cookies[name] = '';
    }
    console.log(this.cookies);
  }

  extendExpiryForAll() {
    console.log('EXTEND EXPIRY FOR ALL COOKIES');
    for (const name in this.cookies) {
      document.cookie = `${name}=${this.cookies[name]};max-age=3600;path=/`;
    }
  }
}

export default Cookie;
