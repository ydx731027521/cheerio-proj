const express = require("express");
// const utility = require("utility");
const cheerio = require("cheerio");
const superagent = require("superagent");
const ep = require("eventproxy")();
const URL = require("url");

const cnodeUrl = "https://cnodejs.org/";

superagent.get(cnodeUrl).end(function (err, res) {
  if (err) {
    return console.error(err);
  }

  const topicUrls = [];
  const $ = cheerio.load(res.text);

  $("#topic_list .topic_title").each(function (idx, element) {
    const $element = $(element);
    // $element.attr('href') 本来的样子是 /topic/542acd7d5d28233425538b04
    // 我们用 url.resolve 来自动推断出完整 url，变成
    // https://cnodejs.org/topic/542acd7d5d28233425538b04 的形式
    // 具体请看 http://nodejs.org/api/url.html#url_url_resolve_from_to 的示例
    const href = URL.resolve(cnodeUrl, $element.attr("href"));
    topicUrls.push(href);
  });

  ep.after("topic_html", topicUrls.length, function (topics) {
    // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair
    topics = topics.map(function (topicPair) {
      const topicUrl = topicPair[0];
      const topicHtml = topicPair[1];
      const $ = cheerio.load(topicHtml);

      return {
        title: $(".topic_full_title").text().trim(),
        href: topicUrl,
        comment1: $(".reply_content").eq(0).text().trim(),
      };
    });

    console.log(topics);
  });

  topicUrls.forEach(function (topicUrl) {
    superagent.get(topicUrl).end(function (err, res) {
      ep.emit("topic_html", [topicUrl, res.text]);
    });
  });
});

// const app = express();

// app.get("/", function (req, res, next) {
//   superagent.get("https://cnodejs.org/").end(function (err, sres) {
//     if (err) return next(err);

//     const $ = cheerio.load(sres.text);
//     const items = [];
//     $("#topic_list .topic_title").each(function (idx, element) {
//       const $element = $(element);
//       items.push({
//         title: $element.attr("title"),
//         href: $element.attr("href"),
//       });
//     });

//     res.send(items);
//     // console.log(sres);
//   });

//   // res.send(value);
// });

// app.listen(3333, () => {
//   console.log("running at port 3333");
// });
