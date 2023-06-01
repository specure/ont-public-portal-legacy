SSR setup process:
 - 
 - [install docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-debian-9)
 - Start the ssr middleware on port 3003
 ```bash
docker run -p 3003:3000 -it -d \
    --rm postor/ssr-proxy-puppeteer:1.0.3 ssr-proxy-puppeteer \
    --origin=http://nettest.org
```

 - Configure NGINX to proxy bots requests. Find nginx section inside of your `server` section and update it.
```nginx
......
......
location / {
        set $prerender 0;
        if ($http_user_agent ~* "googlebot|bingbot|yandex|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator") {
                set $prerender 1;
        }

        if ($http_user_agent ~ "Prerender") {
            set $prerender 0;
        }
        if ($uri ~* "\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)") {
           set $prerender 0;
        }

        if ($prerender = 1) {
            rewrite .* /$scheme://$host$request_uri? break;
            proxy_pass http://localhost:3003;
            break;
        }
        try_files $uri $uri.html $uri/ /index.html;
        ssi on;
}
......
......
```

How to check
 -
  - install some plugin to switch user agents like [that](https://chrome.google.com/webstore/detail/user-agent-switcher/lkmofgnohbedopheiphabfhfjgkhfcgf)
  - Change your user agent to bot user agent
  - go to `view-source` of the [page](nettest.org/en/map) (or any other page) click `ctrl+U` in chrome.
  - you should see filled title tag like `<title data-ng-bind="::customerctrl.MAIN.TITLE" class="ng-binding">Open Nettest</title>`
