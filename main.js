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
var contestResults;

drawSettingsButton();

//$.ajax����f�[�^�擾�A���ꂪ�I����Ă��烁�C�������Ɉڂ�
getContestResults()
    .then(function(data) {
		contestResults = data;
        drawTweetBtn();
        console.log('AtCoder_Result_Tweet_Button�͐���Ɏ��s����܂���')
    })


function drawTweetBtn() {

	const buttonID = 'result-tweet-btn';

	var tweetStr = getTweetStr();

    var buttonStr = getButtonStr();

    var tweetButton = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}"
                            class="btn btn-info pull-right"
                            style="width:${getButtonWidth()}px; height:${getButtonHeight()}px"
                            rel="nofollow"
                            onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;"
                            id="${buttonID}">
                        ${buttonStr}</a>`;
                        // �{�^���̃X�^�C����Bootstrap�Ŏw��
                        // href��decode -> encode���悢���A���̕��@����'+'��encode����Ȃ��̂Œ��ł����Ă���

	//�}���O�ɂ��łɗv�f�����݂��Ă���ꍇ�A�v�f���폜
	removeTweetBtn();

    var insertElem = getInsertElem();
    insertElem.insertAdjacentHTML('beforebegin',tweetButton);

    if(document.URL.match('/history')) {
        // �ʒu����
        document.getElementsByClassName('col-sm-6')[1].classList.add('pull-right');
    }
	
    function getTweetStr() {
        if (contestResults.length === 0) {
            return `@chokudai AtCoder���Q�����܂��I`;
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
                // �R���e�X�g�Q����1��; �O��Ƃ̔�r�����highest����Ȃ�
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
	
	function getDate(endtime) {
		var time = moment(endtime);
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
		$(`#${buttonID}`).remove();
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