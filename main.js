// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.1.5
// @description  AtCoder�̃��[�U�[�y�[�W�ɍŌ�ɎQ�������R���e�X�g�̏����c�C�[�g����{�^����ǉ����܂�
// @author       miozune
// @license      MIT
// @supportURL   https://github.com/miozune/AtCoder_Result_Tweet_Button
// @match        https://beta.atcoder.jp/users/*
// @match        https://atcoder.jp/user/*
// @exclude      https://beta.atcoder.jp/users/*/history/json
// ==/UserScript==
(() => {
if(!document.URL.match('//beta')) {
	var betaLink = "beta".link(getBetaURL())
	$("#main-div > .container").prepend(getWarning(`���̃T�C�g��${betaLink}�łł͂���܂���BAtCoder_Result_Tweet_Button��${betaLink}�łł̂ݓ��삵�܂�`));
	return;

	function getWarning(content) {
		return `<div class="alert alert-warning" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="����"><span aria-hidden="true">�~</span></button>${content}</div>`;
	}

	function getBetaURL() {
		return `https://beta.atcoder.jp${document.location.pathname.replace('user', 'users')}`
	}
}
if (!document.URL.match(`/${userScreenName}`)) {
	 // �����̃��[�U�[�y�[�W�łȂ���΃{�^����\�����Ȃ�
	return;
}

var settings = {};
settings.dateFormat = 'Y/M/D'
settings.tweetFormat = 
`\${ContestDate} \${ContestName}
Rank: \${Rank}(\${IsRated ? 'rated' : 'unrated'})
Perf: \${Performance}\${PerformanceHighestString}\${(InnerPerformance !== Performance) ? \`(inner:\${InnerPerformance})\` : ''}
Rating: \${NewRating}(\${Diff}\${RatingHighestString})`;
settings.RatingHighestString = ', highest!';
settings.PerformanceHighestString = '(highest!)';

var contestResults;

appendStyles();

drawSettingsButton();

//$.ajax����f�[�^�擾�A���ꂪ�I����Ă��烁�C�������Ɉڂ�
getContestResults()
    .then(function(data) {
		contestResults = shapeData(data);
        drawTweetBtn();
        console.log('AtCoder_Result_Tweet_Button�͐���Ɏ��s����܂���')
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
`
	$('head').append(`<style>${css}</style>`);
}

function shapeData(data){
	//�f�[�^�𐮌`���AContestScreenName/Diff/IsHighest(Rate|Perf)�����������ɂ���
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

	//�}���O�Ɋ����v�f���폜
	removeTweetBtn();

	if(document.URL.match('/history$')) {
		$('#history > tbody .text-left').each((i,elem) => {
			var contestName = $('a', elem)[0].textContent;
			var tweetButton = getInlineTweetButton(contestName);
			$(elem).append(tweetButton);
		})
		// Tooltip�̗L����
		$('[data-toggle="tooltip"]').tooltip();
        // �ʒu����
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
    data-original-title="���̉�̌��ʂ��c�C�[�g"></a>`);
		}
    }
	
	var tweetStr = contestResults.length === 0 ? `@chokudai AtCoder���Q�����܂��I` :  getTweetStr(contestResults[contestResults.length - 1]);

    var buttonStr = getButtonStr();

	var tweetButton = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}"
                            class="btn btn-info pull-right"
                            rel="nofollow"
                            onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
                            id="${buttonID}">
                        ${buttonStr}</a>`;
                        // �{�^���̃X�^�C����Bootstrap�Ŏw��
                        // href��URI�p�̃G���R�[�_(encodeURIComponent)���g�p���A+����s�����������ŏ�������悤�ɂ���

	console.log(tweetButton);

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
		var RatingIsHighest = contestResult.RatingIsHighest;
		var RatingHighestString = RatingIsHighest ? settings.RatingHighestString : '';
		var PerformanceIsHighest = contestResult.PerformanceIsHighest;
		var PerformanceHighestString = PerformanceIsHighest ? settings.PerformanceHighestString : '';
        var Performance = contestResult.Performance;
        var InnerPerformance = contestResult.InnerPerformance;
        var NewRating = contestResult.NewRating;
		var OldRating = contestResult.OldRating;
		var Diff = `${(contestResult.Diff >= 0) ? '+' : ''}${contestResult.Diff}`; //+ or -;

		var tweetStr = eval(`\`${settings.tweetFormat}\``);
		return encodeURIComponent(tweetStr);
    }
	
    function getButtonStr() {
        if (contestResults.length === 0) {
            return `�c�C�[�g`;
        } else {
            var latestContestResult = contestResults[contestResults.length - 1];
            var contestDate = getDate(latestContestResult.EndTime);
            var contestName = latestContestResult.ContestName;
            return `${contestDate}<br>${contestName}<br>�̌��ʂ��c�C�[�g����`;
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
            // �R���e�X�g���ѕ\
            return document.getElementById('history_wrapper');
        } else {
            // �v���t�B�[��
            return document.getElementsByTagName("p")[1];
        }
	}

	function removeTweetBtn() {
		$(`#${buttonID} , .result-tweet-btn-inline`).remove();
	}
}

function drawSettingsButton() {
	const lsKey = 'AtCoder_Result_Tweet_Button_Settings'
	
	//���E�B���h�E�Őݒ肪�X�V���ꂽ���ɐݒ���X�V
	window.addEventListener("storage", function (event) {
		if (event.storageArea !== lsKey) return;
		settings = JSON.stringify(event.newValue);
	})
	function getSettingsFromLS() {
		settings = JSON.parse(localStorage.getItem(lsKey));
	}
	function setSettingsToLS() {
		localStorage.setItem(lsKey, JSON.stringify(settings));
	}
}

function getContestResults() {
    // JQuery��Ajax�֐�; Get��url����f�[�^���擾���AJSON�Ƃ��ĉ��߂���
    // userScreenName��beta.atcoder.jp�̃O���[�o���ϐ�
    // atcoder.jp(��beta�ŃT�C�g)��userScreenName�����/history/json���T�|�[�g���Ă��Ȃ�
    return $.ajax({
        type: 'GET',
        dataType: 'json',
        url: `/users/${userScreenName}/history/json`
    });
}
})();