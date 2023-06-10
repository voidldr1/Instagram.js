# Instagram.js
---
Instagram NodeJS API. This API aims to be easy to use and understand.
It only require `https` module.

## Examples
---
```js
// This short program will logs you in, output your public informations, then logs you out.
const Instagram = require("./Instagram.js");

const I = new Instagram();

(async function() {
    
    const login_username = "YOUR_USERNAME",
          login_password = "YOUR_PASSWORD";

    if (!await I.login(login_username, login_password))
        return console.log("Failed to log in.");

    console.log(await I.getUserInfo(login_username));

    if (!await I.logout())
        return console.log("Failed to log in.");
 })();
```

## Functions
---
#### login(username, password, tmp=false)
This function logs you in to your instagram account and only saves the cookies and credentials if the `tmp` is false.
#### logout()
This function logs you out of your session.
#### getUserInfo(username)
Returns public informations of the specified user.
#### getFeedReels()
Returns the list of the reels of your feed.
#### getSavedPosts(next="")
Returns a list of the posts you saved. `next` is used to specify pages.
#### follow(username, userid)
Follow the specified user. `userid` is prioritized over `username`.
#### unfollow(username, userid)
Unfollow the specified user. `userid` is prioritized over `username`.
#### block(username, userid)
Block the specified user. `userid` is prioritized over `username`.
#### unblock(username, userid)
Unblock the specified user. `userid` is prioritized over `username`.
#### getFollowing(username, next="", userid)
Returns the list of the users the specified user is following. `next` is used to specify pages. `userid` is prioritized over `username`.
#### getFollowers(username, next="", userid)
Returns the list of the users following the specified user. `next` is used to specify pages. `userid` is prioritized over `username`.
#### getUserPosts(username, next="")
Returns the list of posts of the specified user. `next` is used to specify pages.
#### getUserClips(username, next="")
Returns the list of clips of the specified user. `next` is used to specify pages.
#### getUserTaggedPosts(username, next="")
Returns the list of posts the specified user has been tagged on. `next` is used to specify pages.
#### getUserHighlightReels(username, userid)
Returns the list of highlight reels of the specified user. `userid` is prioritized over `username`.
#### getHighlightReel(highlightid)
Returns informations of the specified highlight reel.
