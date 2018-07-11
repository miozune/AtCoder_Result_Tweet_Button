// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.0
// @description  AtCoderのユーザーページに最近参加したコンテストの情報をツイートするボタンを追加します
// @description  beta版でのみ動作します
// @author       miozune
// @license      MIT
// @supportURL   https://twitter.com/miozune
// @match        https://beta.atcoder.jp/users/*
// ==/UserScript==


//$.ajaxからデータ取得、これが終わってからメイン処理に移る
getContestResults()
    .then(function (data) {
        main(data);
    });


function main(contestResults) {
    var tweetStr = undefined
    if (contestResults.length === 0) {
        tweetStr = '@chokudai AtCoderに参加します！';
    }
    else {
        tweetStr = getTweetStr(contestResults);
    }

    var tweetScript = `<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>`;
    var tweetBtn = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}" class="btn btn-default col-xs-offset-8 col-xs-4" rel="nofollow" onclick="window.open((this.href),'twwindow','width=550, height=450, personalbar=0, toolbar=0, scrollbars=1'); return false;">ツイート</a>`;

    var insertElem = document.getElementsByTagName("p")[1];

    insertElem.insertAdjacentHTML('beforebegin', tweetBtn);
    insertElem.insertAdjacentHTML('beforebegin', tweetScript);


    function getTweetStr(contestResults) {
        if (contestResults.length > 1) {
            var latestContestResult = contestResults[contestResults.length - 1];
            var secondLatestContestResult = contestResults[contestResults.length - 2];

            console.log(latestContestResult)

            var contestDate = getDate(latestContestResult.EndTime);
            var contestName = latestContestResult.ContestName;
            var rank = latestContestResult.Place;
            var isRated = latestContestResult.IsRated ? '(rated)' : '(unrated)';
            var performance = latestContestResult.Performance;
            var performanceIsHighest = performanceIsHighest_func(performance);
            var innerPerformance = latestContestResult.InnerPerformance > performance ? ('(inner: ' + String(latestContestResult.InnerPerformance) + ')') : ''
            var newRating = latestContestResult.NewRating;
            var previousRating = secondLatestContestResult.NewRating;
            var ratingDiff = newRating - previousRating;
            var ratingDiffString = (ratingDiff >= 0) ? '(%2b' + String(ratingDiff) : '(' + String(ratingDiff); //+ or -
            var ratingIsHighest = ratingIsHighest_func(newRating);

            return contestDate + ' ' + contestName + '%0aRank: ' + String(rank) + isRated + '%0aPerf: ' + String(performance) + performanceIsHighest + innerPerformance + '%0aRating: ' + String(newRating) + ratingDiffString + ratingIsHighest;
            //sample
            //1970/1/1 AtCoder Beginner Contest 999
            //Rank: 1(rated)
            //Perf: 1600(highest!)(inner: 9999)
            //Rating: 9999(+9999, highest!)


            function getDate(endtime) {
                //2018-07-07 => 2018/7/7
                var year = endtime.substr(0, 4);
                var month = endtime.substr(5, 1).replace('0', '') + endtime.substr(6, 1);
                var day = endtime.substr(8, 1).replace('0', '') + endtime.substr(9, 1);
                return year + '/' + month + '/' + day;
            }

            function performanceIsHighest_func(performance) {
                var performanceHistory = [];
                var i;
                for (i = 0; i < contestResults.length; i++) {
                    performanceHistory.push(contestResults[i].Performance);
                }
                return (Math.max.apply(null, performanceHistory) === performance) ? '(highest!)' : '';
            }

            function ratingIsHighest_func(rating) {
                var ratingHistory = [];
                var i;
                for (i = 0; i < contestResults.length; i++) {
                    ratingHistory.push(contestResults[i].NewRating)
                }
                return (Math.max.apply(null, ratingHistory) === newRating) ? ', highest!)' : ')';
            }
        }


        else {
            var latestContestResult2 = contestResults[contestResults.length - 1];

            console.log(latestContestResult2)

            var contestDate2 = getDate(latestContestResult2.EndTime);
            var contestName2 = latestContestResult2.ContestName;
            var rank2 = latestContestResult2.Place;
            var isRated2 = latestContestResult2.IsRated ? '(rated)' : '(unrated)';
            var performance2 = latestContestResult2.Performance;
            var innerPerformance2 = latestContestResult2.InnerPerformance > performance2 ? ('(inner: ' + String(latestContestResult2.InnerPerformance) + ')') : ''
            var newRating2 = latestContestResult2.NewRating;

            return contestDate2 + ' ' + contestName2 + '%0aRank: ' + String(rank2) + isRated2 + '%0aPerf: ' + String(performance2) + innerPerformance2 + '%0aRating: ' + String(newRating2);
            //sample
            //1970/1/1 AtCoder Beginner Contest 999
            //Rank: 1(rated)
            //Perf: 1600(inner: 9999)
            //Rating: 9999


            function getDate(endtime) {
                //2018-07-07 => 2018/7/7
                var year = endtime.substr(0, 4);
                var month = endtime.substr(5, 1).replace('0', '') + endtime.substr(6, 1);
                var day = endtime.substr(8, 1).replace('0', '') + endtime.substr(9, 1);
                return year + '/' + month + '/' + day;
            }
        }
    }
}


function getContestResults() {
    //JQueryのAjax関数。Getでurlからデータを取得し、Jsonとして解釈する
    return $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `/users/${userScreenName}/history/json`
    });
};
