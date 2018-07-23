// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.1.5
// @description  AtCoderのユーザーページに最後に参加したコンテストの情報をツイートするボタンを追加します
// @author       miozune
// @license      MIT
// @supportURL   https://github.com/miozune/AtCoder_Result_Tweet_Button
// @match        https://beta.atcoder.jp/users/*
// @match        https://atcoder.jp/user/*
// @exclude      https://beta.atcoder.jp/users/*/history/json
// ==/UserScript==


if(!document.URL.match('//beta')) {
    alert('このサイトはbeta版ではありません\nAtCoder_Result_Tweet_Buttonはbeta版でのみ動作します');
} else if(!document.URL.match(`/${userScreenName}`)) {
    ; // 自分のユーザーページでなければボタンを表示しない
}


else {
    //$.ajaxからデータ取得、これが終わってからメイン処理に移る
    getContestResults()
        .then(function(data) {
            main(data);
            console.log('AtCoder_Result_Tweet_Buttonは正常に実行されました')
        })


    function main(contestResults) {
        var tweetStr = getTweetStr();

        var buttonStr = getButtonStr();

        var tweetButton = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}"
                              class="btn btn-info pull-right"
                              style="width:${getButtonWidth()}px; height:${getButtonHeight()}px"
                              rel="nofollow"
                              onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;">
                           ${buttonStr}</a>`;
                          // ボタンのスタイルはBootstrapで指定
                          // hrefはdecode -> encodeがよいが、この方法だと'+'がencodeされないので直打ちしている

        var insertElem = getInsertElem();
        insertElem.insertAdjacentHTML('beforebegin',tweetButton);

        if(document.URL.match('/history')) {
            // 位置調節
            document.getElementsByClassName('col-sm-6')[1].classList.add('pull-right');
        }


        function getTweetStr() {
            if (contestResults.length === 0) {
                return `@chokudai AtCoder初参加します！`;
            }

            else {
                /*
                sample1
                1970/1/1 AtCoder Beginner Contest 999
                Rank: 1(rated)
                Perf: 1600(highest!)(inner: 9999)
                Rating: 9999(+9999, highest!)
                */

                /*
                sample2
                1970/1/1 AtCoder Beginner Contest 999
                Rank: 1(unrated)
                Perf: 0
                Rating: 9999(+0)
                */


                var latestContestResult = contestResults[contestResults.length - 1];

                console.log(latestContestResult);

                var contestDate = getDate(latestContestResult.EndTime);
                var contestName = latestContestResult.ContestName;
                var rank = latestContestResult.Place;
                var isRated = latestContestResult.IsRated ? 'rated' : 'unrated';
                var performance = latestContestResult.Performance;
                var innerPerformance = latestContestResult.InnerPerformance > performance ? `(inner: ${latestContestResult.InnerPerformance})` : ``;
                var newRating = latestContestResult.NewRating;


                if (contestResults.length === 1){
                    // コンテスト参加回数1回; 前回との比較およびhighest判定なし
                    return `${contestDate} ${contestName}%0aRank: ${rank}(${isRated})%0aPerf: ${performance}${innerPerformance}%0aRating: ${newRating}`;
                }

                else {
                    var secondLatestContestResult = contestResults[contestResults.length - 2];

                    var performanceIsHighest = performanceIsHighest_func(performance);
                    var previousRating = secondLatestContestResult.NewRating;
                    var ratingDiff = newRating - previousRating;
                    var ratingDiffString = (ratingDiff >= 0) ? `%2b${ratingDiff}` : `${ratingDiff}`; //+ or -
                    var ratingIsHighest = ratingIsHighest_func(newRating);

                    return `${contestDate} ${contestName}%0aRank: ${rank}(${isRated})%0aPerf: ${performance}${performanceIsHighest}${innerPerformance}%0aRating: ${newRating}(${ratingDiffString}${ratingIsHighest})`;


                    function performanceIsHighest_func(performance) {
                        var performanceHistory = [];
                        for (var i=0; i<contestResults.length; i++) {
                            performanceHistory.push(contestResults[i].Performance);
                        }
                        return (Math.max.apply(null, performanceHistory) === performance) ? '(highest!)' : '';
                    }

                    function ratingIsHighest_func(rating) {
                        var ratingHistory = [];
                        for (var i=0; i<contestResults.length; i++) {
                            ratingHistory.push(contestResults[i].NewRating);
                        }
                        return (Math.max.apply(null, ratingHistory) === newRating) ? ', highest!' : '';
                    }
                }
            }
        }


        function getButtonStr() {
            if (contestResults.length === 0) {
                return `ツイート`;
            } else {
                var latestContestResult = contestResults[contestResults.length - 1];
                var contestDate = getDate(latestContestResult.EndTime);
                var contestName = latestContestResult.ContestName;
                return `${contestDate}<br>${contestName}<br>の結果をツイートする`;
            }
        }

        function getButtonWidth() {
            if (contestResults.length === 0) {
                return 130;
            } else {
                var latestContestResult = contestResults[contestResults.length - 1];
                var contestName = latestContestResult.ContestName;
                return contestName.length * 7 + 25;
            }
        }

        function getButtonHeight() {
            if (contestResults.length === 0) {
                return 35;
            } else {
                return 75;
            }
        }


        function getDate(endtime) {
            // 2000-01-01 => 2000/1/1
            var year = endtime.substr(0, 4);
            var month = endtime.substr(5, 1).replace('0', '') + endtime.substr(6, 1);
            var day = endtime.substr(8, 1).replace('0', '') + endtime.substr(9, 1);
            return `${year}/${month}/${day}`;
        }


        function getInsertElem() {
            if(document.URL.match('/history')) {
                // コンテスト成績表
                return document.getElementById('history_wrapper');
            } else {
                // プロフィール
                return document.getElementsByTagName("p")[1];
            }
        }
    }


    function getContestResults() {
        // JQueryのAjax関数; Getでurlからデータを取得し、JSONとして解釈する
        // userScreenNameはbeta.atcoder.jpのグローバル変数
        // atcoder.jp(非beta版サイト)はuserScreenNameおよび/history/jsonをサポートしていない
        return $.ajax({
            type: 'GET',
            dataType: 'json',
            url: `/users/${userScreenName}/history/json`
        });
    }
}
