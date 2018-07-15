// ==UserScript==
// @name         AtCoder_Result_Tweet_Button
// @namespace    https://greasyfork.org/ja/scripts/370227
// @version      1.1.3
// @description  AtCoder�̃��[�U�[�y�[�W�ɍŌ�ɎQ�������R���e�X�g�̏����c�C�[�g����{�^����ǉ����܂�
// @author       miozune
// @license      MIT
// @supportURL   https://github.com/miozune/AtCoder_Result_Tweet_Button
// @match        https://beta.atcoder.jp/users/*
// @match        https://atcoder.jp/user/*
// @exclude      https://beta.atcoder.jp/users/*/history/json
// ==/UserScript==


if(location.href.split("//")[1].substr(0,4) != "beta") {
    alert('���̃T�C�g��beta�łł͂���܂���\nAtCoder_Result_Tweet_Button��beta�łł̂ݓ��삵�܂�')
} else if(userScreenName != location.href.split("/")[4]) {
    ; // �����̃��[�U�[�y�[�W�łȂ���΃{�^����\�����Ȃ�
}


else {
    //$.ajax����f�[�^�擾�A���ꂪ�I����Ă��烁�C�������Ɉڂ�
    getContestResults()
        .then(function(data) {
        main(data);
        console.log('AtCoder_Result_Tweet_Button�͐���Ɏ��s����܂���')
    })


    function main(contestResults) {
        var tweetStr = getTweetStr(contestResults);

        var buttonStr = getButtonStr(contestResults);

        var tweetScript = `<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');</script>`;
        var tweetButton = `<a href="https://twitter.com/intent/tweet?text=${tweetStr}" class="btn btn-info pull-right" style="width:${getButtonWidth(contestResults)}px; height:${getButtonHeight(contestResults)}px" rel="nofollow" onclick="window.open((this.href),'twwindow','width=400, height=250, personalbar=0, toolbar=0, scrollbars=1'); return false;">${buttonStr}</a>`; // �{�^���̃X�^�C����Bootstrap�Ŏw��

        var insertElem = location.href.split("/").length === 5 ? document.getElementsByTagName("p")[1] : document.getElementsByClassName("checkbox")[0]; // �v���t�B�[�� or �R���e�X�g���ѕ\

        insertElem.insertAdjacentHTML('beforebegin',tweetButton);
        insertElem.insertAdjacentHTML('beforebegin',tweetScript);


        function getTweetStr(contestResults) {
            if (contestResults.length === 0) {
                return `@chokudai AtCoder���Q�����܂��I`;
            }

            else {
                //sample1
                //1970/1/1 AtCoder Beginner Contest 999
                //Rank: 1(rated)
                //Perf: 1600(highest!)(inner: 9999)
                //Rating: 9999(+9999, highest!)

                //sample2
                //1970/1/1 AtCoder Beginner Contest 999
                //Rank: 1(unrated)
                //Perf: 0
                //Rating: 9999(+0)


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


        function getButtonStr(contestResults) {
            if (contestResults.length === 0) {
                return `�c�C�[�g`;
            } else {
                var latestContestResult = contestResults[contestResults.length - 1];
                var contestDate = getDate(latestContestResult.EndTime);
                var contestName = latestContestResult.ContestName;
                return `${contestDate}<br>${contestName}<br>�̌��ʂ��c�C�[�g����`;
            }
        }

        function getButtonWidth(contestResults) {
            if (contestResults.length === 0) {
                return 130;
            } else {
                var latestContestResult = contestResults[contestResults.length - 1];
                var contestName = latestContestResult.ContestName;
                return contestName.length * 7 + 25;
            }
        }

        function getButtonHeight(contestResults) {
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
    }


    function getContestResults() {
        // JQuery��Ajax�֐�; Get��url����f�[�^���擾���AJSON�Ƃ��ĉ��߂���
        // userScreenName��beta.atcoder.jp�̃O���[�o���ϐ�
        // ���݂�url����擾���Ȃ��̂͊Ԉ���ĕʃ��[�U�[�̃f�[�^���c�C�[�g���Ȃ��悤�ɂ��邽��
        // atcoder.jp(��beta�ŃT�C�g)��userScreenName�����/history/json���T�|�[�g���Ă��Ȃ�
        return $.ajax({
            type: 'GET',
            dataType: 'json',
            url: `/users/${userScreenName}/history/json`
        });
    }
}