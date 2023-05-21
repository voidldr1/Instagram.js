const https = require("https"),
      fs_consts = require("fs").constants,
      fs = require("fs").promises;

const COOKIESAVENAME = "cookies.json",
      CHRWINUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      APPIOSUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 243.1.0.14.111 (iPhone12,5; iOS 15_5; 320dpi; 2660x3840; 382468104)",
      HOSTURL = "https://www.instagram.com/";

async function fileExist(path) {

    return await fs.access(path, fs_consts.F_OK).then(() => true).catch(() => false);
}

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

        this.cookies = {};
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

        if (!tmp && await fileExist(username+"_"+COOKIESAVENAME))
            return await this.importCookies(COOKIESAVENAME, username);

        let req = await this.get(HOSTURL, false);
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
//         this.options.headers["X-ASBD-ID"] = "idk what this is";

        req = await this.post("https://graphql.instagram.com/graphql/", `doc_id=3810865872362889&variables=%7B%22ig_did%22%3A%22${ig_did}%22%2C%22first_party_tracking_opt_in%22%3A${first_party}%2C%22third_party_tracking_opt_in%22%3Afalse%2C%22input%22%3A%7B%22client_mutation_id%22%3A0%7D%7D`, false); // "I accept the cookies"
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        req = await this.get("https://www.instagram.com/api/v1/web/data/shared_data/", false);
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        this.options.headers["X-CSRFToken"] = this.getCookie("csrftoken");

        req = await this.post("https://www.instagram.com/accounts/login/ajax/", `enc_password=#PWD_INSTAGRAM:0:${parseInt(Date.now() * .001)}:${password}&username=${username}&queryParams={}&optIntoOneTap=false&stopDeletionNonce=&trustedDeviceRecords={}`);
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        content = req.json();
        if (!content.authenticated) {

            console.log(content, req);
            return false;
        }

        this.options.headers["X-CSRFToken"] = this.getCookie("csrftoken"),

        this.client.username = username,
        this.client.id = content.userId;

        if (!tmp)
            return await this.exportCookies(COOKIESAVENAME, username);

        return true;
    }

    async logout(tmp=false) {

        let req = await this.post("https://www.instagram.com/api/v1/web/accounts/logout/ajax/", `one_tap_app_login=0&user_id=${this.client.id}`);
        if (req.statusCode != 200) {

            console.log(req.text(), req);
            return false;
        }

        if (!tmp)
            await fs.unlink(COOKIESAVENAME);

        return true;
    }

    async getProfileInfoFromUsername(username) {

        let req = await this.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, true, APPIOSUA); // or https://www.instagram.com/${username}/?__a=1&__d=dis
        if (req.statusCode != 200)
            return {status: "fail", response: req, text: req.text()};

        return req.json();
    }

    async getFeedReels() {

        let req = await this.get("https://i.instagram.com/api/v1/feed/reels_tray/", true, APPIOSUA);
        if (req.statusCode != 200)
            return {status: "fail", response: req, text: req.text()};

        return req.json();
    }

    async getSavedPosts(max_id="") { // getNextSavedPosts(json) ??

        let req = await this.get(`https://www.instagram.com/api/v1/feed/saved/posts/${max_id.length?"?max_id="+max_id:""}`, true, APPIOSUA);
        if (req.statusCode != 200)
            return {status: "fail", response: req, text: req.text()};

        return req.json();
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

    async exportCookies(path, username) { // This actually not just saves the cookies.

        try {

            await fs.writeFile(username+"_"+path, JSON.stringify({cookies:this.cookies, options:this.options, client:this.client}));
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
            this.client = datas.client;

            return true;
        }
        catch(e) {

            console.log(`Error while importing cookies :\n${e}`);
            return false;
        }
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

            https.get(url, options, res => {

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

    async sleep(ms) {

        return new Promise(r=>{setTimeout(r,parseInt(ms))});
    }
}

module.exports = Instagram;
