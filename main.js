// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.2.2
// @description  AtCoderのユーザーページに最後に参加したコンテストの情報をツイートするボタンを追加します
// @author       miozune, keymoon
// @license      MIT
// @supportURL   https://github.com/miozune/AtCoder_Result_Tweet_Button
// @match        https://beta.atcoder.jp/users/*
// @match        https://atcoder.jp/user/*
// @exclude      https://beta.atcoder.jp/users/*/history/json
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js
// @require      https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js
// ==/UserScript==


// userScreenNameはbeta.atcoder.jpのグローバル変数
// atcoder.jp(非beta版サイト)はuserScreenNameおよび/history/jsonをサポートしていない



(async () => {

// beta版に誘導
if(!document.URL.match('//beta')) {
    const betaLink = "beta版".link(getBetaURL());
    $("#main-div > .container").prepend(getWarning(`このサイトは${betaLink}ではありません。AtCoder_Result_Tweet_Buttonは${betaLink}でのみ動作します`));
    return;

    function getWarning(content) {
        return `<div class="alert alert-warning" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="閉じる"><span aria-hidden="true">×</span></button>${content}</div>`;
    }

    function getBetaURL() {
        return `https://beta.atcoder.jp${document.location.pathname.replace('user', 'users')}`;
    }
}

// 自分のユーザーページでなければボタンを表示しない
if (!isMyPage()) {
    return;
}



// ------------------------------
// ここからメイン処理
// ------------------------------


// 初期化
let settings;

// ・cssを適用
// ・設定画面を初期化
// ・コンテストデータを取得、加工
// ・ツイートボタンの描画
appendStyles();
initSettingsArea();
const rawContestResults = await getContestResults();
const contestResults = shapeData(rawContestResults);
// console.log(contestResults);
drawTweetBtn();



// ------------------------------
// ここまでメイン処理
// ここから関数群
// ------------------------------



// ajaxで取得したコンテストデータを整形して返す
function shapeData(data){
    let maxPerf = -1;
    let maxRate = -1;
    for (let i=0; i<data.length; i++) {
        data[i].PerformanceIsHighest = data[i].Performance > maxPerf;
        data[i].RatingIsHighest = data[i].NewRating > maxRate;
        data[i].OldRating = i === 0 ? 0 : data[i-1].NewRating;
        data[i].Diff = data[i].NewRating - data[i].OldRating;
        data[i].ContestScreenName = data[i].ContestScreenName.split('.')[0];

        maxPerf = Math.max(maxPerf, data[i].Performance);
        maxRate = Math.max(maxRate, data[i].NewRating);
    }
    return data;
}


// ブロック及びインラインのツイートボタンを描画
function drawTweetBtn() {
    const buttonID = 'result-tweet-btn';

    // 繰り返し呼び出されるので挿入前に既存要素を削除
    removeTweetBtn();

    // ブロックのボタンを描画
    const blockTweetButton = getBlockTweetButton();
    const blockInsertElem = getBlockInsertElem();
    blockInsertElem.insertAdjacentHTML('beforebegin', blockTweetButton);

    // 「コンテスト成績表」のページならインラインのボタンを描画
    if (isHistoryPage()) {
        $('#history > tbody .text-left').each((_, elem) => {
            const contestName = $('a', elem)[0].textContent;
            const inlineTweetButton = getInlineTweetButton(contestName);
            $(elem).append(inlineTweetButton);
        });
        // 位置調節
        document.getElementsByClassName('col-sm-6')[1].classList.add('pull-right');
    }

    // Tooltipの有効化
    $('[data-toggle="tooltip"]').tooltip();


    // 最新のコンテストデータからブロックのボタン要素を取得
    function getBlockTweetButton() {
        const blockTweetStr = contestResults.length === 0 ? `@chokudai AtCoder初参加します！` :  getTweetStr(contestResults[contestResults.length - 1]);
        const blockButtonStr = getBlockButtonStr();
        const blockTweetDom =
`<a href="https://twitter.com/share?text=${blockTweetStr}&url=https://greasyfork.org/ja/scripts/370227-atcoder-result-tweet-button"
    class="btn btn-info pull-right"
    rel="nofollow"
    onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
    id="${buttonID}">${blockButtonStr}</a>`;
        return blockTweetDom;
    }

    // コンテスト名を指定してインラインのボタン要素を取得
    function getInlineTweetButton(contestName) {
        const contestResult = contestResults.find(elem => elem.ContestName === contestName);
        if (!contestResult) return;
        const inlineTweetStr = getTweetStr(contestResult);
        return (
`<a href="https://twitter.com/share?text=${inlineTweetStr}&url=https://greasyfork.org/ja/scripts/370227-atcoder-result-tweet-button"
class="result-tweet-btn-inline" rel="nofollow"
onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
data-toggle="tooltip"
data-original-title="この回の結果をツイート"></a>`);
    }

    // ある回のコンテストデータからユーザー設定に応じたツイート文字列を生成
    function getTweetStr(contestResult) {
        const ContestDate = getDate(contestResult.EndTime);
        const ContestName = contestResult.ContestName;
        const ContestScreenName = contestResult.ContestScreenName;
        const ContestScreenName_Upper = ContestScreenName.toUpperCase();
        const Rank = contestResult.Place;
        const IsRated = contestResult.IsRated;
        const PerformanceIsHighest = contestResult.PerformanceIsHighest;
        const PerformanceHighestString = PerformanceIsHighest ? settings.PerformanceHighestString : '';
        const Performance = contestResult.Performance;
        const InnerPerformance = contestResult.InnerPerformance;
        const RatingIsHighest = contestResult.RatingIsHighest;
        const RatingHighestString = RatingIsHighest ? settings.RatingHighestString : '';
        const NewRating = contestResult.NewRating;
        const OldRating = contestResult.OldRating;
        const Diff = `${(contestResult.Diff >= 0) ? '+' : ''}${contestResult.Diff}`;  // + or -

        const tweetStr = eval(`\`${settings.tweetFormat}\``) + '\n';

        // URI用のエンコーダを使用し、+や改行もうまく処理する
        return encodeURIComponent(tweetStr);
    }

    function getBlockButtonStr() {
        if (contestResults.length === 0) {
            return `ツイート`;
        } else {
            const latestContestResult = contestResults[contestResults.length - 1];
            const contestDate = getDate(latestContestResult.EndTime);
            const contestName = latestContestResult.ContestName;
            return `${contestDate}<br>${contestName}<br>の結果をツイートする`;
        }
    }

    function getDate(endtimestr) {
        const time = moment(endtimestr);
        return time.format(settings.dateFormat);
    }

    function getBlockInsertElem() {
        return isHistoryPage() ? document.getElementById('history_wrapper') : document.getElementsByTagName("p")[1];
    }

    function removeTweetBtn() {
        $(`#${buttonID} , .result-tweet-btn-inline`).remove();
    }
}


// 設定画面の初期化
// ・localStorageから初期設定を取得、未設定なら初期化
// ・設定ブロックを描画
// ・設定入力エリアを描画
// ・設定入力エリアの監視
// ・他ウィンドウとの連携を設定
function initSettingsArea() {
    const lsKey = 'AtCoder_Result_Tweet_Button_Settings';
    getSettingsFromLS();
    if (!settings) {
        setDefaultSettings();
    }

    $('#main-container').append(getSettingsDiv());

    drawSettingsInputArea();

    settingsInputAreaObserver();
    otherWindowObserver();


    function drawSettingsInputArea() {
        $('#tweetstr-settings-dateformat').val(settings.dateFormat);
        $('#tweetstr-settings-highestperformance').val(settings.PerformanceHighestString);
        $('#tweetstr-settings-highestrating').val(settings.RatingHighestString);
        $('#tweetstr-settings-tweetformat').val(settings.tweetFormat);
        const result = getSampleString(settings);
        $('#tweetstr-settings-preview').val(result.preview);
    }

    function getSampleString(newSettings) {
        const ContestDate = moment().format(newSettings.dateFormat);
        const ContestName = "AtCoder Grand Contest 999";
        const ContestScreenName = "agc999";
        const ContestScreenName_Upper = "AGC999";
        const Rank = 100;
        const IsRated = true;
        const PerformanceIsHighest = true;
        const PerformanceHighestString = newSettings.PerformanceHighestString;
        const Performance = "3000";
        const InnerPerformance = "3000";
        const RatingIsHighest = true;
        const RatingHighestString = newSettings.RatingHighestString;
        const NewRating = "2400";
        const OldRating = "2300";
        const Diff = "+100";

        try {
            const tweetStr = eval(`\`${newSettings.tweetFormat}\``);
            return {
                success: true,
                preview: tweetStr,
            };
        }
        catch (e){
            return {
                success: false,
                preview: e.message,
            };
        }
    }

    // 設定入力エリアが更新されたとき、プレビューを更新
    // エラーが無ければ設定を保存、ツイートボタンを再描画
    function settingsInputAreaObserver() {
        $('#tweetstr-settings textarea, #tweetstr-settings input').keyup((() => {
            const newSettings = {};
            newSettings.dateFormat = $('#tweetstr-settings-dateformat').val();
            newSettings.PerformanceHighestString = $('#tweetstr-settings-highestperformance').val();
            newSettings.RatingHighestString = $('#tweetstr-settings-highestrating').val();
            newSettings.tweetFormat = $('#tweetstr-settings-tweetformat').val();
            const result = getSampleString(newSettings);
            $('#tweetstr-settings-preview').val(result.preview);
            if (result.success) {
                settings = newSettings;
                setSettingsToLS();
                drawTweetBtn();
            }
        }));
    }

    // 他ウィンドウで設定が更新された時に設定を再取得、ツイートボタンを再描画、設定入力エリアを更新
    function otherWindowObserver() {
        window.addEventListener("storage", event => {
            // console.log(event);
            if (event.key !== lsKey) return;
            settings = JSON.parse(event.newValue);
            // console.log(settings);
            drawTweetBtn();
            drawSettingsInputArea();
        });
    }

    function setDefaultSettings() {
        settings = {};
        settings.dateFormat = 'Y/M/D';
        settings.PerformanceHighestString = '(highest!)';
        settings.RatingHighestString = ', highest!';
        settings.tweetFormat =
`\${ContestDate} \${ContestName}
Rank: \${Rank}(\${IsRated ? 'rated' : 'unrated'})
Perf: \${Performance}\${PerformanceHighestString}\${(InnerPerformance !== Performance) ? \`(inner:\${InnerPerformance})\` : ''}
Rating: \${NewRating}(\${Diff}\${RatingHighestString})`;
        setSettingsToLS();
    }

    function getSettingsDiv() {
        const dateFormatHint = `moment.jsの形式で指定`;

        const tweetFormatHint =
`<strong>使用可能な変数・関数</strong>
<br>ContestDate
<br>ContestName
<br>ContestScreenName (短縮表記)
<br>ContestScreenName_Upper
<br>Rank
<br>ordinalString (序数表記する関数)
<br>IsRated (bool)
<br>Performance
<br>InnerPerformance
<br>PerformanceHighestString
<br>OldRating
<br>NewRating
<br>Diff (符号付き)
<br>RatingHighestString`;

        const settingsDom =
`<div class="panel panel-default" id="tweetstr-settings">
    <div class="panel-heading" data-toggle="collapse" data-target=".panel-body">
        <span id="dropdown-icon" class="glyphicon glyphicon-chevron-down"></span>
        <span class="glyphicon glyphicon-cog"></span>設定
    </div>
    <div class="panel-body collapse">
        <div class="row">
            <div class="col-sm-4">
                <label>フォーマット設定</label>
                <div class="form-group row">
                    <label for="tweetstr-settings-dateformat" class="col-sm-6 col-form-label" align="right">
                        <span>日付フォーマット</span>
                        <span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" title="${dateFormatHint}" data-container="body" data-html="true"></span>
                    </label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetstr-settings-dateformat">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="tweetstr-settings-highestperformance" class="col-sm-6 col-form-label" align="right">
                        <span>Highest(Performance)</span>
                    </label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetstr-settings-highestperformance">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="tweetstr-settings-highestrating" class="col-sm-6 col-form-label" align="right">
                        <span>Highest(Rating)</span>
                    </label>
                    <div class="col-sm-6">
                        <input class="form-control" id="tweetstr-settings-highestrating">
                    </div>
                </div>
            </div>
            <div class="form-group col-sm-4">
                <label for="tweetstr-settings-tweetformat">
                    <span>ツイート文字列</span>
                    <span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" title="${tweetFormatHint}" data-container="body" data-html="true"></span>
                </label>
                <textarea class="form-control" rows="6" id="tweetstr-settings-tweetformat"></textarea>
            </div>
            <div class="form-group col-sm-4">
                <label for="tweetstr-settings-preview">
                    <span>プレビュー</span>
                </label>
                <textarea class="form-control" rows="6" id="tweetstr-settings-preview" disabled></textarea>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    $(() => {
        $('.panel-heading').click(() => {
            // この段階で属性は変化していない
            if ($('.panel-body').attr('aria-expanded') === 'true') {
                $('#dropdown-icon').attr('class', 'glyphicon glyphicon-chevron-down');
            } else {
                $('#dropdown-icon').attr('class', 'glyphicon glyphicon-chevron-up');
            }
        });
    });
</script>`;

        return settingsDom;
    }

    function getSettingsFromLS() {
        settings = JSON.parse(localStorage.getItem(lsKey));
    }

    function setSettingsToLS() {
        localStorage.setItem(lsKey, JSON.stringify(settings));
    }
}


// /history/jsonから全コンテストデータを取得
function getContestResults() {
    return $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `/users/${userScreenName}/history/json`
    });
}


// 必要なcssを挿入する
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
#tweetstr-settings {
    margin-top: 10px;
}
.tooltip-inner {
    max-width: 200px;
}
.panel-heading {
    cursor: pointer;
}`;

    $('head').append(`<style>${css}</style>`);
}


function isHistoryPage() {
    const parser = new URL(document.URL);
    return parser.pathname.split('/').length === 4;
}

function isMyPage() {
    // history*さんを回避
    return (isHistoryPage() && document.URL.match(`/${userScreenName}/history`)) || (!isHistoryPage() && document.URL.match(`/${userScreenName}`));
}

function ordinalString(i) {
    const j = i % 10;
    const k = i % 100;
    if (j == 1 && k != 11) return i + "st";
    if (j == 2 && k != 12) return i + "nd";
    if (j == 3 && k != 13) return i + "rd";
    return i + "th";
}

})();