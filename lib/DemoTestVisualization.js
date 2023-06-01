"use strict";

var DemoTestVisualization = (function () {
    var _rmbtTest;

    var _infogeo = null;
    var _infoip = null;
    var _infostatus = null;
    var _infoprovider = null;
    var _serverName = null;
    var _remoteIp = null;
    var _providerName = null;
    var _testUUID = '';

    var _redraw_loop = null;
    var _successCallback = null;
    var _errorCallback = null;

    function DemoTestVisualization(successCallback, errorCallback) {
        if (typeof successCallback !== 'undefined') {
            _successCallback = successCallback;
            _errorCallback = errorCallback;
        }

        _infogeo = document.getElementById("infogeo");
        _infoip = document.getElementById("infoip");
        _infostatus = document.getElementById("infostatus");
        _infoprovider = document.getElementById("infoprovider");


        //reset
        _infogeo.innerHTML = '-';
        _infoip.innerHTML = '-';
        _infoprovider.innerHTML = '-';
        $("#infoping span").text("-");
        $("#infodown span").text("-");
        $("#infoup span").text("-");
    }

    // function progress_segment(status, progress) {
    //     var ProgressSegmentsTotal = 96;
    //     var ProgressSegmentsInit = 14;
    //     var ProgressSegmentsPing = 15;
    //     var ProgressSegmentsDown = 34;
    //     var ProgressSegmentsUp = 33;
    //     var progressValue = 0;
    //     var progressSegments = 0;
    //     switch (status) {
    //         case "INIT":
    //             progressSegments = 0;
    //             break;
    //         case "INIT_DOWN":
    //             progressSegments = Math.round(ProgressSegmentsInit * progress);
    //             break;
    //         case "PING":
    //             progressSegments = ProgressSegmentsInit + Math.round(ProgressSegmentsPing * progress);
    //             break;
    //         case "DOWN":
    //             progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + Math.round(ProgressSegmentsDown * progress);
    //             break;
    //         case "INIT_UP":
    //             progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown;
    //             break;
    //         case "UP":
    //             progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown + Math.round(ProgressSegmentsUp * progress);
    //             progressSegments = Math.min(95, progressSegments);
    //             break;
    //         case "END":
    //             progressSegments = ProgressSegmentsTotal;
    //             break;
    //         case "QOS_TEST_RUNNING":
    //             progressSegments = 95;
    //             break;
    //         case TestState.SPEEDTEST_END:
    //         case TestState.QOS_END:
    //             progressSegments = 95;
    //             break;
    //         case "ERROR":
    //         case "ABORTED":
    //             progressSegments = 0;
    //             break;
    //     }
    //     progressValue = progressSegments / ProgressSegmentsTotal;
    //     return progressValue;
    // }

    /**
     * Sets the RMBT Test object
     * @param {Object} rmbtTest has to support {RMBTIntermediateResult}.getIntermediateResult
     */
    DemoTestVisualization.prototype.setRMBTTest = function (rmbtTest) {
        _rmbtTest = rmbtTest;
    };

    DemoTestVisualization.prototype.updateInfo = function (serverName, remoteIp, providerName, testUUID) {
        _serverName = serverName;
        _remoteIp = remoteIp;
        _providerName = providerName;
        _testUUID = testUUID;
    };

    /**
     * function to show current status
     * @param {string} curStatus status that will be displayed
     */
    function set_status(curStatus) {
        var elem = null;

        switch (curStatus) {
            case TestState.LOCATE:
                $("#infostatus").text('Locating');
                break;
            case TestState.INIT:
            case TestState.INIT_DOWN:
                $("#infostatus").text('Initializing');
                break;
            case TestState.WAIT:
                $("#infostatus").text('WaitForSlot');
                break;
            case TestState.INIT_UP:
                $("#infostatus").text('Init_Upload');
                elem = "infoup";
                break;
            case TestState.PING:
                $("#infostatus").text('Ping');
                elem = "infoping";
                break;
            case TestState.DOWN:
                $("#infostatus").text('Download');
                elem = "infodown";
                break;
            case TestState.UP:
                $("#infostatus").text('Upload');
                elem = "infoup";
                break;
            case TestState.END:
                $("#infostatus").text('Finished');
                break;
            case TestState.ERROR:
                $("#infostatus").text('Error');
                elem = "not-here";
                break;
            case TestState.ABORTED:
                $("#infostatus").text('Aborted');
                break;
            default:
                console.log("Unknown test state: " + curStatus);
        }
        if (elem !== null) {
            $("#infocurrent").find("div.row").not(":has(#" + elem + ")").find(".loader").hide();
            $("#infocurrent").find("div.row #" + elem + " .loader").show();
        }
        else {
            $("#infocurrent").find("div.row  .loader").hide();
        }
    }

    DemoTestVisualization.prototype.setStatus = function (status) {
        set_status(status);
    };

    DemoTestVisualization.prototype.setLocation = function (latitude, longitude) {
        //from Opentest.js
        var formatCoordinate = function (decimal, label_positive, label_negative) {
            var label = (deg < 0) ? label_negative : label_positive;
            var deg = Math.floor(Math.abs(decimal));
            var tmp = Math.abs(decimal) - deg;
            var min = tmp * 60;
            return label + " " + deg + "&deg; " + min.toFixed(3) + "'";
        };

        var text = "";
        latitude = formatCoordinate(latitude, 'N', 'S');
        longitude = '&emsp;' + formatCoordinate(longitude, 'E', 'W');
        text = latitude + " " + longitude;

        //set
        $("#infogeo").html(text);
    };

    var lastProgress = -1;
    var lastStatus = -1;

    let timestampShown;

    function draw() {
        var status, ping="-", down = "-", up = "-", up_log, down_log;
        var progress, showup = "-", showdown = "-", showping = "-";
        var result = _rmbtTest.getIntermediateResult();

        var pingProgress = -1;
        var dlProgress = -1;
        var ulProgress = -1;

        if (result === null || (result.progress === lastProgress && lastProgress !== 1 && lastStatus === result.status.toString())
            && lastStatus !== TestState.QOS_TEST_RUNNING && lastStatus !== TestState.QOS_END && lastStatus !== TestState.SPEEDTEST_END) {
            _redraw_loop = setTimeout(draw, 250);
            return;
        }
        lastProgress = result.progress;
        lastStatus = result.status.toString();

        if (result !== null) {
            status = result.status.toString();
            if (result.pingNano && result.pingNano !== -1) {
                ping = result.pingNano;
                ping = Math.round(ping / 1000000);
              }
      
              if (result.downBitPerSec && result.downBitPerSec !== -1) {
                down = result.downBitPerSec;
                down = Math.round(down / 1000000);
              }
      
              if (result.upBitPerSec && result.upBitPerSec !== -1) {
                up = result.upBitPerSec;
                up = Math.round(up / 1000000);
              }


            progress = result.progress;
            //console.log("down:"+down+" up:"+up+" ping:"+ping+" progress:"+progress+" status:"+status);
        }

        if (_serverName !== undefined && _serverName !== null && _serverName !== '') {
            $("#infoserver").text(_serverName);
        }

        if (_remoteIp !== undefined && _remoteIp !== null && _remoteIp !== '') {
            _infoip.innerHTML = _remoteIp;
        }

        if (_providerName !== undefined && _providerName !== null && _providerName !== '') {
            _infoprovider.innerHTML = _providerName;
        }
        switch(status) {
            case "PING":
                if (!timestampShown) {
                    console.log('Initialisation started at:', new Date().toISOString());
                    timestampShown = true;
                }
                $("#ping .box-progress-init").hide();
                $("#ping .box-progress-main span").css("width", Math.round(progress*100) + "%");
                break;
            case "DOWN":
                $("#ping .box-progress-main span").css("width", "100%");
                $("#ping .box-value").text(ping);
                $("#ping").addClass("ready");


                $("#download .box-progress-init").hide();
                $("#download .box-progress-main span").css("width", Math.round(progress*100) + "%");
                $("#download .box-value").text(down);
                
                break;
            case "INIT_UP":
                $("#download .box-progress-main span").css("width", "100%");
                $("#download").addClass("ready");
                break;
            case "UP":
                $("#upload .box-progress-init").hide();
                $("#upload .box-progress-main span").css("width", Math.round(progress*100) + "%"); 
                $("#upload .box-value").text(up);
                break;
            case "END":
                $("#upload .box-progress-main span").css("width", "100%"); 
                $("#upload").addClass("ready");
                break;
        }

        set_status(status);

        if (status !== "END" && status !== "ERROR" && status !== "ABORTED") {
            _redraw_loop = setTimeout(draw, 250);
            //Draw a new chart
        } else if (status === "ERROR" || status === "ABORTED") {
            timestampShown = false;
            if (_errorCallback !== null) {
                var t = _errorCallback;
                _errorCallback = null;
                t(result);
            }
        } else if (status === "END") {
            timestampShown = false;
            // call callback that the test is finished
            if (_successCallback !== null) {
                var t = _successCallback;
                _successCallback = null;
                result["testUUID"] = _testUUID;
                t(result);
            }
        }
    }

    /**
     * Starts the gauge/progress bar
     * and relies on .getIntermediateResult() therefor
     *  (function previously known as draw())
     */
    DemoTestVisualization.prototype.startTest = function () {
        //first draw, then the timeout should kick in
        draw();
    };

    return DemoTestVisualization;
})();
