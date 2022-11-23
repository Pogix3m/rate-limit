# rate-limit [![Build Status](https://travis-ci.org/Pogix3m/rate-limit.svg?branch=master)](https://travis-ci.org/Pogix3m/rate-limit) [![GitHub license](https://img.shields.io/github/license/Pogix3m/rate-limit)](https://github.com/Pogix3m/rate-limit/blob/master/LICENSE) ![GitHub package.json version](https://img.shields.io/github/package-json/v/Pogix3m/rate-limit)

Used to limit call to function. Useful when doing HTTP requests

## Installation

```sh
$ npm install --save @pogix3m/rate-limit
```

## Usage

```javascript
const RateLimit = require("@pogix3m/rate-limit").default;

(async () => {
    const rate = new RateLimit({ maxLimit: 2, intervalMS: 5_000 });

    // RESULT: every after 2 call of rate.check() it delays next call for 5sec
    await Promise.all([
        rate.Check().then(() => console.log(new Date().toISOString(), ": a")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": b")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": c")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": d")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": e")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": f")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": g")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": h")),
        rate.Check().then(() => console.log(new Date().toISOString(), ": i")),
    ]);

    /*
        2021-03-14T05:54:48.838Z : a
        2021-03-14T05:54:48.841Z : b
        2021-03-14T05:54:53.828Z : c
        2021-03-14T05:54:53.828Z : d
        2021-03-14T05:54:58.834Z : e
        2021-03-14T05:54:58.834Z : f
        2021-03-14T05:55:03.830Z : g
        2021-03-14T05:55:03.831Z : h
        2021-03-14T05:55:08.839Z : i
    */

    /*******************************************************************************/
    
    const weightedRate = new RateLimit({ maxLimit: 5, intervalMS: 5_000, maxWeight: 10 });

    await Promise.all([
        // 3 request, total of 9 weight
        weightedRate.Check(3).then(() => console.log(new Date().toISOString(), ": a")),
        weightedRate.Check(3).then(() => console.log(new Date().toISOString(), ": b")),
        weightedRate.Check(3).then(() => console.log(new Date().toISOString(), ": c")),

        // 1 request, total of 9 weight
        weightedRate.Check(9).then(() => console.log(new Date().toISOString(), ": d")),

        // 5 request, total of 8 weight
        weightedRate.Check(2).then(() => console.log(new Date().toISOString(), ": e")),
        weightedRate.Check(2).then(() => console.log(new Date().toISOString(), ": f")),
        weightedRate.Check(2).then(() => console.log(new Date().toISOString(), ": g")),
        weightedRate.Check(1).then(() => console.log(new Date().toISOString(), ": h")),
        weightedRate.Check(1).then(() => console.log(new Date().toISOString(), ": i")),

        // 1 request, total of 1 weight
        weightedRate.Check(1).then(() => console.log(new Date().toISOString(), ": j")),
    ]);

    /*
        2022-11-23T11:43:23.275Z : a
        2022-11-23T11:43:23.278Z : b
        2022-11-23T11:43:23.278Z : c
        2022-11-23T11:43:28.277Z : d
        2022-11-23T11:43:33.279Z : e
        2022-11-23T11:43:33.279Z : f
        2022-11-23T11:43:33.280Z : g
        2022-11-23T11:43:33.280Z : h
        2022-11-23T11:43:33.280Z : i
        2022-11-23T11:43:38.278Z : j
    */
})();


```
