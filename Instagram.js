const https = require("https"),
      fs_consts = require("fs").constants,
      fs = require("fs").promises;

const COOKIESAVENAME = "cookies.json",
      CHRWINUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 (320dpi; 2660x3840; 382468104)",
      HOSTURL = "https://www.instagram.com/";

class Instagram {

    constructor() {

        this.client = {};

        this.options = {
            "credentials": "include",
            "headers": {
                "User-Agent": CHRWINUA,
                "Accept": "*/*",
                "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
                "Origin": "https://www.instagram.com",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                'X-Requested-With': 'XMLHttpRequest',
            },
            "mode": "cors"
        };

        this.tmp = false;
        this.cookies = {};
        this.cache_userids = {};
    }

    async login(username, password, tmp=false) {

        if (!username || !password) {

            console.log("Missing username or password.");
            return false;
        }
        if (typeof username != "string" || typeof password != "string") {

            console.log("Wrong type of username or password. (Should be strings)");
            return false;
        }

        this.tmp = tmp;

        if (!tmp && await this.fileExist(username+"_"+COOKIESAVENAME))
            return await this.importCookies(COOKIESAVENAME, username);

        let req = await this.get("https://www.instagram.com/accounts/login/", false);
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        let content = req.text(),
            csrf_token = content.match(/csrf_token\\":\\"([0-9a-zA-Z]*)/g)[0].split("\\\":\\\"")[1],
            app_id = content.match(/appId":"([0-9]*)/g)[0].split("\":\"")[1],
            ig_did = content.match(/ig_did":{"value":"(([0-9A-Z]|-)*)/g)[0].split("\":\"")[1],
            first_party = content.match(/first_party_only":([a-z]*)/g)[0].split("\":")[1];

        this.options.headers["X-CSRFToken"] = csrf_token,
        this.options.headers["X-IG-App-ID"] = app_id,
        this.options.headers["X-Web-Device-Id"] = ig_did,
        this.options.headers['X-Instagram-AJAX'] = "1",
        this.options.headers["X-IG-WWW-Claim"] = "0";

        let simulateURL = [
            "https://static.cdninstagram.com/rsrc.php/v3/yg/l/0,cross/4OtA3OX2A1CX8OBwlLmL5M.css?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yD/r/9ZroPORAzX0.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3iC9_4/yj/l/fr_FR/JZFni9rVRcwA3cXYCBTKTwlSpWYVA7N9jJIkVjYc-U_E-j2J2UeJxx_73Jg8t0NDmV-WzKjBGIEmwzTabzZ-5eNN8Bl2bmn551V48C4cLv79-NzhoyCdNs8HPb34n_fa3dpWIohmRQ2b689JcIvHMqWqyNsIcNz5Fd-7qWtmw1z4KICpI-xef1LIWSw5eUShmNdXdWvsWqehdEtWwDQVEH-g-FDC.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3iE2F4/yB/l/fr_FR/-_yloxJkyPs.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3igtj4/y5/l/fr_FR/RjQ2cUUemq8.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3i1dc4/yC/l/fr_FR/j6escAZYAkS.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yT/r/anVzA6ibaF6.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3iWwB4/yD/l/fr_FR/rqfU0nZJbqr.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3iEIY4/y3/l/fr_FR/t8gWDPI541s.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yf/r/EfKY1FH5jWa.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/y8/r/ITFf0wk6W2N.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yh/r/_uI25qIWgdC.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yb/r/lswP1OF1o6P.png",
            "https://static.cdninstagram.com/rsrc.php/yv/r/BTPhT6yIYfq.ico",
            "https://static.cdninstagram.com/rsrc.php/v3/yN/r/9M34q5pGEkH.js?_nc_x=Ij3Wp8lg5Kz",
            "https://www.instagram.com/ajax/bootloader-endpoint/?modules=PolarisBDClientSignalCollectionTrigger&__d=www&__user=0&__a=1&__req=1&__hs=19507.HYP%3Ainstagram_web_perf_holdout_pkg.2.1..0.0&dpr=1&__ccg=EXCELLENT&__rev=1007579915&__s=%3A%3Acsao39&__hsi=7239018798168984761&__dyn=7xeUmwlE7ibwKBWo2vwAxu13w8CewSwMwNw9G2S0lW4o0B-q1ew65xO2O1Vw8G1Qw5Mx61vw9m1YwBgao6C0Mo5W3S7U2cxe0EUjwGzE2swwwNwKwHw8Xwn82Lx_w4HwJwSyES1Twoob82ZwrUdUco2Ywmo6O0A8&__csr=hsc9NinPlGnh7uRShtqpeh4yuFUwzUtxau1rKdQ4Ey9gy6Ft2EKlfXCy8Z4w04UHwpLw9a1HwKzdwyo0Ihw5Egdo6K3QUlwlo18N1oR3U5kE&__comet_req=28&__spin_r=1007579915&__spin_b=trunk&__spin_t=1685465406",
            "https://www.instagram.com/api/v1/public/landing_info/",
            "https://connect.facebook.net/en_US/sdk.js",
            "https://connect.facebook.net/en_US/sdk.js?hash=2d7637f97a9d4c3b343234ab5fdab86c",
            "https://static.cdninstagram.com/images/instagram/xig/homepage/phones/home-phones.png?__makehaste_cache_breaker=HOgRclNOosk",
            "https://static.cdninstagram.com/rsrc.php/v3/yS/r/ajlEU-wEDyo.png",
            "https://www.instagram.com/images/instagram/xig/homepage/screenshots/screenshot1.png?__d=www",
            "https://www.instagram.com/images/instagram/xig/homepage/screenshots/screenshot2.png?__d=www",
            "https://www.instagram.com/images/instagram/xig/homepage/screenshots/screenshot3.png?__d=www",
            "https://www.instagram.com/images/instagram/xig/homepage/screenshots/screenshot4.png?__d=www",
            "https://www.facebook.com/x/oauth/status?client_id=124024574287414&input_token&origin=1&redirect_uri=https%3A%2F%2Fwww.instagram.com%2F&sdk=joey&wants_cookie_data=true",
            "https://static.cdninstagram.com/rsrc.php/v3/yM/r/9dI6PNxZWpA.js?_nc_x=Ij3Wp8lg5Kz",
            "https://static.cdninstagram.com/rsrc.php/v3/yl/r/1ojlxVWHc_G.png",
            "https://static.cdninstagram.com/rsrc.php/v3/yr/r/093c-DX36-y.png",
            "https://static.cdninstagram.com/rsrc.php/v3/y5/r/TJztmXpWTmS.png",
            "https://static.cdninstagram.com/rsrc.php/v3/yZ/r/mgRcAxJAixP.js?_nc_x=Ij3Wp8lg5Kz",
        ];
        for (let url of simulateURL) {

            let req = await this.get(url, false);
            if (req.statusCode != 200) {

                console.log(req.text(), req);
                return false;
            }
        }

        req = await this.post("https://graphql.instagram.com/graphql/", `doc_id=3810865872362889&variables=%7B%22ig_did%22%3A%22${ig_did}%22%2C%22first_party_tracking_opt_in%22%3A${first_party}%2C%22third_party_tracking_opt_in%22%3Afalse%2C%22input%22%3A%7B%22client_mutation_id%22%3A0%7D%7D`, false); // "I accept the cookies"
        if (req.statusCode != 200) {

            console.log(req, req.text());
            return false;
        }

        req = await this.get("https://www.instagram.com/api/v1/web/data/shared_data/", false);
        if (req.statusCode != 200) {

            console.log(req, req.text());
            return false;
        }

        this.options.headers["X-CSRFToken"] = this.getCookie("csrftoken");

        req = await this.post("https://www.instagram.com/accounts/login/ajax/", `enc_password=#PWD_INSTAGRAM:0:${parseInt(Date.now() * .001)}:${password}&username=${username}&queryParams={}&optIntoOneTap=false&stopDeletionNonce=&trustedDeviceRecords={}`);
        if (req.statusCode != 200) {

            console.log(req, req.text());
            return false;
        }

        content = req.json();
        if (!content.authenticated) {

            console.log(req, content);
            return false;
        }

        this.options.headers["X-CSRFToken"] = this.getCookie("csrftoken"),

        this.client.username = username,
        this.cache_userids[username] = this.client.id = content.userId;


        if (!tmp)
            return await this.exportCookies();

        return true;
    }

    async relogin(password, logout=true) {

        if (logout)
            if (!this.logout())
                return false;

        let username = this.client.username;

        this.client = {},
        this.options = {
            "credentials": "include",
            "headers": {
                "User-Agent": CHRWINUA,
                "Accept": "*/*",
                "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3",
                "Origin": "https://www.instagram.com",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                'X-Requested-With': 'XMLHttpRequest',
            },
            "mode": "cors"
        },
        this.tmp = false,
        this.cookies = {};

        return await this.login(username, password);
    }

    async logout() {

        let req = await this.post("https://www.instagram.com/api/v1/web/accounts/logout/ajax/", `one_tap_app_login=0&user_id=${this.client.id}`);
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        if (!this.tmp)
            await fs.unlink(COOKIESAVENAME);

        return true;
    }

    async getFeedReels() {

        return await this.getJSON("https://i.instagram.com/api/v1/feed/reels_tray/");
    }

    async getSavedPosts(next="") { // getNextSavedPosts(json) ??

        return await this.getJSON(`https://www.instagram.com/api/v1/feed/saved/posts/${next.length>0?"?max_id="+next:""}`);
    }

    async getUserInfo(username, remember=true) {

        let check = await this.checkAndRememberUsername(username, remember);
        if (check.status != "ok")
            return check;

        let req = await this.getJSON(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`); // or https://www.instagram.com/${username}/?__a=1&__d=dis

        return req;
    }

    async follow(username, userid) {

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.postURIENCODED(`https://www.instagram.com/api/v1/web/friendships/${id}/follow/`, "");
    }

    async unfollow(username, userid) {

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.postURIENCODED(`https://www.instagram.com/api/v1/web/friendships/${id}/unfollow/`, "");
    }

    async block(username, userid) {

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.postURIENCODED(`https://www.instagram.com/api/v1/web/friendships/${id}/block/`, "");
    }

    async unblock(username, userid) {

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.postURIENCODED(`https://www.instagram.com/api/v1/web/friendships/${id}/unblock/`, "");
    }

    async getUserPosts(username, next="") { // getUserNextPosts(json) ??

        let check = await this.checkAndRememberUsername(username, false);
        if (check.status != "ok")
            return check;

        return await this.getJSON(`https://www.instagram.com/api/v1/feed/user/${username}/username/?count=50${next.length>0?"&max_id="+next:""}`);
    }

    async getUserClips(username, next="", userid) { // getUserNextClips(json) ??

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.postURIENCODED("https://www.instagram.com/api/v1/clips/user/", `target_user_id=${id}&page_size=50${next.length>0?"&max_id="+next:""}&include_feed_video=true`);
    }

    async getUserTaggedPosts(username, next="", userid) { // getUserNextTaggedPosts(json) ??

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.getJSON(`https://www.instagram.com/graphql/query/?query_hash=be13233562af2d229b008d2976b998b5&variables={"id":"${id}","first":50${next.length>0?`,"after":"${next}"`:""}}`);
    }

    async getUserHighlightReels(username, userid) {

        let id = await this.checkAndRememberUserID(username, userid);

        return await this.getJSON(`https://www.instagram.com/graphql/query/?query_hash=d4d88dc1500312af6f937f7b804c68c3&variables={"user_id":"${id}","include_chaining":false,"include_reel":true,"include_suggested_users":false,"include_logged_out_extras":false,"include_highlight_reels":true,"include_live_status":true}`);
    }

    async getHighlightReel(highlightid) {

        if (typeof highlightid != "string")
            return {status: "fail", text: "Highlight reel id should be a string."};

        return await this.getJSON(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:${highlightid}`);
    }

    /* Core functions */

    getCookie(name) {return this.cookies[name];}
    setCookie(name, value) {this.cookies[name] = value;}

    updateCookies(array) {

        if (!array)
            return;

        for (let cookie of array) {

            let cookieValue = cookie.split("; ")[0];
            this.cookies[cookieValue.substring(0, cookieValue.indexOf("="))] = cookieValue.substring(cookieValue.indexOf("=") + 1);
        }
    }

    stringifyCookies() {

        let cookieArray = [];

        for (let name in this.cookies)
            cookieArray.push(name+"="+this.cookies[name]);

        return cookieArray.join("; ");
    }

    async exportCookies() { // This actually not just saves the cookies.

        try {

            await fs.writeFile(this.client.username+"_"+COOKIESAVENAME, JSON.stringify({cookies:this.cookies, options:this.options, client:this.client, cache_userids:this.cache_userids}));
            return true;
        }
        catch(e) {

            console.log(`Error while saving cookies :\n${e}`);
            return false;
        }
    }

    async importCookies(path, username) {

        try {

            let datas = JSON.parse(await fs.readFile(username+"_"+path));
            this.cookies = datas.cookies,
            this.options = datas.options,
            this.client = datas.client,
            this.cache_userids = datas.cache_userids;

            return true;
        }
        catch(e) {

            console.log(`Error while importing cookies :\n${e}`);
            return false;
        }
    }

    async checkAndRememberUserID(username, userid) {

        let id = userid;
        if (typeof userid != "string") {

            let check = await this.checkAndRememberUsername(username);
            if (check.status != "ok")
                return check;

            id = this.cache_userids[username];
        }

        return id;
    }

    async checkAndRememberUsername(username, remember=true) {

        if (typeof username != "string") return {status: "fail", text: "Username should be a string."};
        if (!/^[a-zA-Z0-9_.]*$/.test(username)) return {status: "fail", text: `Invalid username (${username}).`};

        if (remember && !this.cache_userids[username]) {

            let req = await this.getUserInfo(username, false);
            if (req.status != "ok")
                return req;

            this.cache_userids[username] = req.data.user.id;

            if (!this.tmp)
                await this.exportCookies();

            await this.sleep(1000);
        }

        return {status: "ok"};
    }

    async getJSON(url, userAgent=CHRWINUA) {

        let req = await this.get(url, true, userAgent);
        if (req.statusCode != 200)
            return {status: "fail", response: req, text: req.text()};

        return req.json();
    }

    async postURIENCODED(url, data, userAgent=CHRWINUA) {

        let req = await this.post(url, data, true, userAgent);
        if (req.statusCode != 200)
            return {status: "fail", response: req, text: req.text()};

        return req.json();
    }
    async get(url, useCookie=true, userAgent) {

        return new Promise(resolve => {

            let response = {},
                options = JSON.parse(JSON.stringify(this.options));

            options.method = "GET",
            options.referrer = HOSTURL;

            if (useCookie)
                options.headers["Cookie"] = this.stringifyCookies();

            if (userAgent)
                options.headers["User-Agent"] = userAgent;

            https.get(url.replace("http:", "https:"), options, res => {

                response.statusCode = res.statusCode,
                response.headers = res.headers;

                this.updateCookies(res.headers["set-cookie"]);

                let data = [];

                res.on("data", d => {
                    data.push(d);
                }).on("end", () => {
                    response.buffer = Buffer.concat(data);
                });

            }).on("close", e => {

                response.url = url,
                response.text = () => response.buffer.toString(),
                response.json = () => JSON.parse(response.buffer.toString());
                resolve(response);
            }).on("error", e => {
                console.log(e); // WARNING Unstable : Can get stuck
            });
        });
    }

    async post(url, data, useCookie=true, userAgent) {

        return new Promise(resolve => {

            let parsedURL = new URL(url),
                response = {url:url},
                options = JSON.parse(JSON.stringify(this.options));

            options.hostname = parsedURL.hostname,
            options.path = parsedURL.pathname,
            options.port = 443,

            options.headers["Content-Type"] = "application/x-www-form-urlencoded", // WARNING What if it needs JSON
            options.headers["Content-Length"] = data.length,

            options.method = "POST",
            options.referrer = HOSTURL;

            if (useCookie)
                options.headers["Cookie"] = this.stringifyCookies();

            if (userAgent)
                options.headers["User-Agent"] = userAgent;

            let req = https.request(options, res => {

                response.statusCode = res.statusCode,
                response.headers = res.headers;

                this.updateCookies(res.headers["set-cookie"]);

                let data = [];

                res.on("data", d => {
                    data.push(d);
                }).on("end", () => {
                    response.buffer = Buffer.concat(data);
                });
            });

            req.on("close", e => {

                response.url = url,
                response.text = () => response.buffer.toString(),
                response.json = () => JSON.parse(response.buffer.toString());
                resolve(response);
            })
            req.on("error", e => {
                console.log(e); // WARNING Unstable : Can get stuck
            });
            req.write(data);
            req.end();
        });
    }

    async fileExist(path) {

        return await fs.access(path, fs_consts.F_OK).then(() => true).catch(() => false);
    }

    async sleep(ms) {

        return new Promise(r=>{setTimeout(r,parseInt(ms))});
    }

    async rsleep(ms, rms) {

        return new Promise(r=>{setTimeout(r,parseInt(ms + Math.random() * (rms || ms)))});
    }
}

module.exports = Instagram;
