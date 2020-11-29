# dohp

Dohp is a joyless, small, no-frills DoH DNS proxy server, with support for a
couple of different DoH services. By default it connects to Mozilla's dedicated 
Cloudflare endpoint. Dohp caches responses, avoiding upstream requests until 
TTLs expire.

Example use case: run it on a raspberry pi on your local network, and 
set your router to use the pi as its DNS server.

## Install
```
$ npm install -g dohp
```

## Usage
```
$ dohp --help
usage:
  dohp [-p <port>] [-i <bind IP>] [-s <DoH service>]
  dohp [-p <port>] [-i <bind IP>] [-u <custom DoH service URL>]

service options:
  mozilla-cloudflare
  google
  cloudflare
  quad9
  cleanbrowsing-security
  cleanbrowsing-family
  cleanbrowsing-adult
  adguard
  adguard-family

$ sudo dohp -p 53
DNS server listening on 0.0.0.0:53
Connected to upstream service https://mozilla.cloudflare-dns.com/dns-query
```

To complete setup on your network, set your router's DNS server to the IP of
the device.