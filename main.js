// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.1.5
// @description  AtCoderのユーザーページに最後に参加したコンテストの情報をツイートするボタンを追加します
// @author       miozune, keymoon
// @license      MIT
// @supportURL   https://github.com/miozune/AtCoder_Result_Tweet_Button
// @match        https://beta.atcoder.jp/users/*
// @match        https://atcoder.jp/user/*
// @exclude      https://beta.atcoder.jp/users/*/history/json
// ==/UserScript==
(() => {
if(!document.URL.match('//beta')) {
    var betaLink = "beta版".link(getBetaURL())
    $("#main-div > .container").prepend(getWarning(`このサイトは${betaLink}ではありません。AtCoder_Result_Tweet_Buttonは${betaLink}でのみ動作します`));
    return;

    function getWarning(content) {
        return `<div class="alert alert-warning" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="閉じる"><span aria-hidden="true">×</span></button>${content}</div>`;
    }

    function getBetaURL() {
        return `https://beta.atcoder.jp${document.location.pathname.replace('user', 'users')}`
    }
}
if (!document.URL.match(`/${userScreenName}`)) {
     // 自分のユーザーページでなければボタンを表示しない
    return;
}

var settings;
var contestResults;

appendStyles();
initSettingsArea();

//$.ajaxからデータ取得、これが終わってからメイン処理に移る
getContestResults()
    .then(function(data) {
        contestResults = shapeData(data);
        drawTweetBtn();
        console.log('AtCoder_Result_Tweet_Buttonは正常に実行されました')
    })

function appendStyles() {
    const css =
`a.result-tweet-btn-inline {
    display: inline-block;
    margin: -4px 2px;
    width: 20px;
    height: 20px;
    cursor: pointer;
    border-radius: 4px;
    background-image: url(/public/img/share/twitter.png);
}
#tweetbtn-settings {
    margin-top: 10px;
}
`
    $('head').append(`<style>${css}</style>`);
}

function shapeData(data){
    //データを整形し、ContestScreenName/Diff/IsHighest(Perf|Rate)をいい感じにする
    var maxPerf = -1;
    var maxRate = -1;
    for (var i = 0; i < data.length; i++) {
        data[i].PerformanceIsHighest = data[i].Performance > maxPerf;
        data[i].RatingIsHighest = data[i].NewRating > maxRate;
        data[i].OldRating = i === 0 ? 0 : data[i - 1].NewRating;
        data[i].Diff = data[i].NewRating - data[i].OldRating;
        data[i].ContestScreenName = data[i].ContestScreenName.split('.')[0];

        maxPerf = Math.max(maxPerf, data[i].Performance);
        maxRate = Math.max(maxRate, data[i].NewRating);
    }
    return data;
}

function drawTweetBtn() {

    const buttonID = 'result-tweet-btn';

    //挿入前に既存要素を削除
    removeTweetBtn();

    if(document.URL.match('/history$')) {
        $('#history > tbody .text-left').each((i,elem) => {
            var contestName = $('a', elem)[0].textContent;
            var tweetButton = getInlineTweetButton(contestName);
            $(elem).append(tweetButton);
        })
        // Tooltipの有効化
        $('[data-toggle="tooltip"]').tooltip();
        // 位置調節
        document.getElementsByClassName('col-sm-6')[1].classList.add('pull-right');

        function getInlineTweetButton(contestName) {
            var contestResult = contestResults.find(elem => elem.ContestName === contestName);
            if (!contestResult) return;
            var tweetStr = getTweetStr(contestResult);
            return (
`<a href="https://twitter.com/intent/tweet?text=${tweetStr}"
    class="result-tweet-btn-inline" rel="nofollow"
    onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
    data-toggle="tooltip"
    data-original-title="この回の結果をツイート"></a>`);
        }
    }

    var tweetStr = contestResults.length === 0 ? `@chokudai AtCoder初参加します！` :  getTweetStr(contestResults[contestResults.length - 1]);

    var buttonStr = getButtonStr();

    var tweetButton = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}"
                            class="btn btn-info pull-right"
                            rel="nofollow"
                            onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
                            id="${buttonID}">
                        ${buttonStr}</a>`;
                        // ボタンのスタイルはBootstrapで指定
                        // hrefはURI用のエンコーダ(encodeURIComponent)を使用し、+や改行もいい感じで処理するようにした

    var insertElem = getInsertElem();
    insertElem.insertAdjacentHTML('beforebegin',tweetButton);



    function getTweetStr(contestResult) {
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

        //console.log(contestResult);


        var ContestDate = getDate(contestResult.EndTime);
        var ContestName = contestResult.ContestName;
        var ContestScreenName = contestResult.ContestScreenName;
        var Rank = contestResult.Place;
        var IsRated = contestResult.IsRated;
        var PerformanceIsHighest = contestResult.PerformanceIsHighest;
        var PerformanceHighestString = PerformanceIsHighest ? settings.PerformanceHighestString : '';
        var Performance = contestResult.Performance;
        var InnerPerformance = contestResult.InnerPerformance;
        var RatingIsHighest = contestResult.RatingIsHighest;
        var RatingHighestString = RatingIsHighest ? settings.RatingHighestString : '';
        var NewRating = contestResult.NewRating;
        var OldRating = contestResult.OldRating;
        var Diff = `${(contestResult.Diff >= 0) ? '+' : ''}${contestResult.Diff}`; //+ or -;

        var tweetStr = eval(`\`${settings.tweetFormat}\``);
        return encodeURIComponent(tweetStr);
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

    function getDate(endtimestr) {
        var time = moment(endtimestr);
        return time.format(settings.dateFormat);
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

    function removeTweetBtn() {
        $(`#${buttonID} , .result-tweet-btn-inline`).remove();
    }
}

function initSettingsArea() {
    const lsKey = 'AtCoder_Result_Tweet_Button_Settings'
    getSettingsFromLS();
    if (!settings) {
        setDefaultSettings();
    }
    //他ウィンドウで設定が更新された時に設定を更新
    window.addEventListener("storage", function (event) {
        console.log(event);
        if (event.key !== lsKey) return;
        settings = JSON.parse(event.newValue);
        console.log(settings);
        drawTweetBtn();
        drawSettingsArea();
    })
    $('#main-container').append(getSettingsDiv());
    $('#tweetbtn-settings textarea,#tweetbtn-settings input').keyup((() => {
        var newSettings = {};
        newSettings = settings;
        newSettings.tweetFormat = $('#tweetbtn-settings-format').val();
        newSettings.dateFormat = $('#tweetbtn-settings-dateformat').val();
        newSettings.PerformanceHighestString = $('#tweetbtn-settings-highestperformance').val();
        newSettings.RatingHighestString = $('#tweetbtn-settings-highestrating').val();
        var result = getSampleString(newSettings);
        $('#tweet-str-settings-formatted').val(result[1]);
        if(result[0]) {
            settings = newSettings;
            setSettingsToLS();
            drawTweetBtn();
        }
    }));
    drawSettingsArea();
    function drawSettingsArea() {
        $('#tweetbtn-settings-format').val(settings.tweetFormat);
        $('#tweetbtn-settings-dateformat').val(settings.dateFormat);
        $('#tweetbtn-settings-highestperformance').val(settings.PerformanceHighestString);
        $('#tweetbtn-settings-highestrating').val(settings.RatingHighestString);
        var result = getSampleString(settings);
        $('#tweet-str-settings-formatted').val(result[1]);
    }
    function getSampleString(settings) {
        contestResult = {}
        var ContestDate = moment().format(settings.dateFormat);
        var ContestName = "AtCoder Grand Contest 999";
        var ContestScreenName = "agc999";
        var Rank = 100;
        var IsRated = true;
        var PerformanceIsHighest = true;
        var PerformanceHighestString = settings.PerformanceHighestString;
        var Performance = "3000";
        var InnerPerformance = "3000";
        var RatingIsHighest = true;
        var RatingHighestString = settings.RatingHighestString;
        var NewRating = "2400";
        var OldRating = "2300";
        var Diff = "+100";

        try {
            var tweetStr = eval(`\`${settings.tweetFormat}\``);
            return [true,tweetStr];
        }
        catch (e){
            return [false,e.message];
        }
    }
    function getSettingsFromLS() {
        settings = JSON.parse(localStorage.getItem(lsKey));
    }
    function setSettingsToLS() {
        localStorage.setItem(lsKey, JSON.stringify(settings));
    }
    function setDefaultSettings() {
        settings = {};
        settings.dateFormat = 'Y/M/D'
        settings.tweetFormat =
`\${ContestDate} \${ContestName}
Rank: \${Rank}(\${IsRated ? 'rated' : 'unrated'})
Perf: \${Performance}\${PerformanceHighestString}\${(InnerPerformance !== Performance) ? \`(inner:\${InnerPerformance})\` : ''}
Rating: \${NewRating}(\${Diff}\${RatingHighestString})`;
        settings.PerformanceHighestString = '(highest!)';
        settings.RatingHighestString = ', highest!';
        setSettingsToLS();
    }
    function getSettingsDiv() {
        var tooltipTitle =
`<strong>使用可能な変数・関数</strong>
<br>ContestDate
<br>ContestName
<br>ContestScreenName (短縮表記)
<br>Rank
<br>ordinalString (序数表記する関数)
<br>IsRated (bool)
<br>Performance
<br>InnerPerformance
<br>PerformanceHighestString
<br>OldRating
<br>NewRating
<br>Diff (符号付き)
<br>RatingHighestString`

        var dom =
`<div class="panel panel-default" id="tweetbtn-settings">
    <div class="panel-heading" data-toggle="collapse" data-target=".panel-body">
        <span id="dropdown-icon" class="glyphicon glyphicon-chevron-down"></span>
        <span class="glyphicon glyphicon-cog"></span>設定
    </div>
    <div class="panel-body collapse">
        <div class="row">
            <div class="col-sm-4">
                <label>フォーマット設定</label>
                <div class="form-group row">
                    <label for="tweetbtn-settings-dateformat" class="col-sm-6 col-form-label" align="right">日付フォーマット</label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetbtn-settings-dateformat">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="tweetbtn-settings-highestperformance" class="col-sm-6 col-form-label" align="right">Highest(Performance)</label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetbtn-settings-highestperformance">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="tweetbtn-settings-highestrating" class="col-sm-6 col-form-label" align="right">Highest(Rating)</label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetbtn-settings-highestrating">
                    </div>
                </div>
            </div>
            <div class="form-group col-sm-4">
              <label for="settings-tweet-str">ツイート文字列</label>
              <span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" title="${tooltipTitle}" data-container="body" data-html="true"></span>
              <textarea class="form-control" rows="6" id="tweetbtn-settings-format"></textarea>
            </div>
            <div class="form-group col-sm-4">
              <label for="settings-tweet-str-formatted">プレビュー</label>
              <textarea class="form-control" rows="6" id="tweet-str-settings-formatted" disabled></textarea>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
        $('.panel-heading').click(() => {
            // この段階で属性は変化していない
            if ($('.panel-body').attr('aria-expanded') === 'true') {
                $('#dropdown-icon').attr('class', 'glyphicon glyphicon-chevron-down');
            } else {
                $('#dropdown-icon').attr('class', 'glyphicon glyphicon-chevron-up');
            }
        });
    });
</script>
<style type="text/css">
    .tooltip-inner{
        max-width: 200px;
    }
</style>`
        return dom;
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

function ordinalString(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

})();