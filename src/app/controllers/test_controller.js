CanvasRenderingContext2D.prototype.fillTextCircle = function (text, x, y, radius, startAngle, clockwise, inwardFacing, kerning) {
	/////
	var textInside = false; // TODO: make parameter
	/////

	if (!kerning) {
		kerning = 0; // kerning defaults to 0
	}

	var textHeight = this.measureTextHeight(text);

	var clockwiseFlag = clockwise ? 1 : -1;
	var inwardFacingFlag = inwardFacing ? 1 : -1;

	if (textInside) {
		radius -= textHeight;
	}

	// reverse
	if (!clockwise && inwardFacing || clockwise && !inwardFacing) {
		text = text.split("").reverse().join("");
	}

	this.save();
	this.translate(x, y);

	startAngle += (Math.PI * !inwardFacing); // Rotate 180 if outward

	this.rotate(startAngle);

	this.textBaseline = "middle"; // Ensure we draw in exact center
	this.textAlign = "center"; // Ensure we draw in exact center

	for (var j = 0; j < text.length; j++) {
		var charWid = this.measureText(text[j]).width;

		this.rotate((charWid / 2) / (radius - textHeight) * clockwiseFlag); // rotate half letter

		// draw the character at "top" or "bottom" depending on inward or outward facing
		this.fillText(text[j], 0, inwardFacingFlag * (0 - radius + textHeight / 2));

		this.rotate((charWid / 2 + kerning) / (radius - textHeight) * clockwiseFlag); // rotate half letter
	}

	this.restore();
};

CanvasRenderingContext2D.prototype.measureTextHeight = function (text) {
	var div = document.createElement("div");

	div.innerHTML = text;
	div.style.position = "absolute";
	div.style.top = "-10000px";
	div.style.left = "-10000px";
	div.style.font = this.font;

	document.body.appendChild(div);

	var textHeight = div.offsetHeight;

	document.body.removeChild(div);

	return textHeight;
};

function deg2rad(value) {
	return value * (Math.PI / 180);
}

function getPointOnCircle(radius, center, phi) {
	var x = radius * Math.cos(phi);
	var y = radius * Math.sin(phi);

	x += center.x;
	y += center.y;

	return {x: x, y: y};
}

function drawLineInDirection(ctx, pointFrom, pointTo, length) {
	var vectorToCenter = {x: (pointTo.x - pointFrom.x), y: pointTo.y - pointFrom.y};
	var vectorLength = Math.sqrt(Math.pow(vectorToCenter.x, 2) + Math.pow(vectorToCenter.y, 2));

	var normalizedVectorToCenter = {x: (vectorToCenter.x / vectorLength), y: (vectorToCenter.y / vectorLength)};
	var vectorToCenterWithLength = {x: (normalizedVectorToCenter.x * length), y: (normalizedVectorToCenter.y * length)};

	ctx.moveTo(pointFrom.x, pointFrom.y);
	ctx.lineTo(pointFrom.x + vectorToCenterWithLength.x, pointFrom.y + vectorToCenterWithLength.y);

	ctx.stroke();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

angular.module("nettestApp").controller("TestController", ["$state", "$stateParams", "$scope", "$rootScope", "$filter", "userFactory", "$log", "$translate", "advertisedSpeedDataService", "MAIN",
	function($state, $stateParams, $scope, $rootScope, $filter, userFactory, $log, $translate, advertisedSpeedDataService, MAIN) {

		var testController = this;

		var translateFilter = $filter("translate");

		///

		testController.testFailed = false;

		testController.serverName = "-";
		testController.remoteIp = "-";
		testController.providerName = "-";
		testController.location = "-";

		testController.phase = "-";
		//testController.status = RMBTWebsocketTestState.WAIT; // default to wait on start

		testController.ping = "-";
		testController.downloadSpeed = "-";
		testController.uploadSpeed = "-";

		var geoTracker, config, delegate, websocketTestClient;

		///

		////////////////////////////////////////////////
		// RMBTWebsocketTestGeolocationTracker Delegate
		////////////////////////////////////////////////

		this.gotResult = function (valid, error) {
			$log.trace("gotResult called");
			$log.trace(valid);
			$log.trace(error);
		};

		this.setLocation = function (latitude, longitude) {
			$log.trace("setLocation called");
			$log.trace(latitude);
			$log.trace(longitude);

			var formatCoordinate = function(decimal, label_positive, label_negative) {
				var label = (deg < 0) ? label_negative : label_positive;
				var deg = Math.floor(Math.abs(decimal));
				var tmp = Math.abs(decimal) - deg;
				var min = tmp * 60;
				return label + " " + deg + "° " + min.toFixed(3) + "'";
			};

			latitude = formatCoordinate(latitude, "North", "South");
			longitude = "\n" + formatCoordinate(longitude, "East", "West");

			testController.location = latitude + " " + longitude;
		};

		this.setCookie = function (coords) {
			$log.trace("setCookie called");
			$log.trace(coords);
		};

		////////////////////////////////////////////////
		// RMBTWebsocketTestClient Delegate
		////////////////////////////////////////////////

		var WebsocketTestClientDelegate = (function() {

			// canvas initialization
			var testCanvas;
			var testCanvasContext;

			//////////

			//static values for the duration of ndt, qos since there is no info from the applet
			var _qosTestDurationMs = 10000;
			var _startTimeQos = -1;

			//Variables
			var _degrees_status = 0; //current status of the animation
			var _new_degrees_status = 0; //current goal of the animation, volatile to jstest.js
			var _old_degrees_status = 0; //the current goal the animation is trying to achieve
			var _difference = 0;

			var _currentSpeed = 0;
			var _qosProgress = 0;

			//var color = "lightgreen"; //green looks better to me
			var _bgcolor = "#d6d6d6";

			var _fgLight = "#9c6169";
			var _fgDark = "#353535";

			var _progressIconText;
			var _progressIconTypes = [];

			var _animation_loop, _redraw_loop;

			var lastStatus = -1;

			var progressPerPhase = 0;

			///

			var ProgressSegmentsInit = 14;
			var ProgressSegmentsPing = 12.5;
			var ProgressSegmentsDown = 34.5;
			var ProgressSegmentsUp = 34;

			var ProgressSegmentsTotal = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown + ProgressSegmentsUp;

			//////////

			var canvasLineWidth = 14;
			var scaleLineWidth = 1;

			var arcRadius = 138;
			var phaseArcTextRadius = 130;
			var progressArcTextRadius = 120;

			var midArcTextFontSize = 60;
			var phaseLegendTextFontSize = 17;
			var iconFontSize = 100;

			var fontName = "px open_sansregular, sans-serif";
			var iconFontName = "px specure-icons";

			var phaseArcCenter = {x: 345, y: 145};


			var progressArcCenter = {x: 160, y: 352};

			///

			var holeSize = deg2rad(4.5); //0.026;

			var phaseStartDegrees = 205; //204;
			var phaseInitSizeDegrees = 36;
			var phasePingSizeDegrees = 30;
			var phaseDownloadSizeDegrees = 100; //101;
			var phaseUploadSizeDegrees = 100;

			var phaseStartRadians = deg2rad(phaseStartDegrees); //deg2rad(204);
			var phaseInitSizeRadians = deg2rad(phaseInitSizeDegrees);
			var phasePingSizeRadians = deg2rad(phasePingSizeDegrees);
			var phaseDownloadSizeRadians = deg2rad(phaseDownloadSizeDegrees); //deg2rad(101);
			var phaseUploadSizeRadians = deg2rad(phaseUploadSizeDegrees);

			var phaseRadians = phaseInitSizeRadians + phasePingSizeRadians + phaseDownloadSizeRadians + phaseUploadSizeRadians + (3 * holeSize);
			var phaseDegrees = phaseRadians / Math.PI * 180;
			var phaseEndRadians = phaseStartRadians + phaseRadians; // 471

			var pi2 = Math.PI * 2;
			var phaseCurrentAngle = phaseStartRadians;

			var progressStartRadians = 0;

			var progressEndDegrees = 306;
			var progressEndRadians = deg2rad(progressEndDegrees);

			var progressLogScaleStart = 1;
			var progressLogScaleEnd = 1000;

			//////////

			function WebsocketTestClientDelegate() {
				initCanvas();

				// assign phase images
				_progressIconTypes[RMBTWebsocketTestState.PING] = String.fromCharCode(0xe80a);
				_progressIconTypes[RMBTWebsocketTestState.DOWN] = String.fromCharCode(0xe808);
				_progressIconTypes[RMBTWebsocketTestState.UP] = String.fromCharCode(0xe809);

				///

				// get colors from css
				_fgLight = angular.element(".aside-container").css("background-color");

				// _fgDark might be defined by .gauge-label-color
				var gaugeLabelColor = getCssValueFromClassNameDefinition("gauge-label", "color");
				if(gaugeLabelColor) {
					_fgDark = gaugeLabelColor;
				} else {
					_fgDark = angular.element("body").css("background-color");
				}
			}

			// Reads a css property from a CSS class definition without the need to have the class used in the DOM
			function getCssValueFromClassNameDefinition(className, attribute) {
				var dummyElement = document.createElement("div");
				dummyElement.classList.add(className);
				dummyElement.style.display = "none";
				document.body.appendChild(dummyElement);
				var style = getComputedStyle(dummyElement);
				return style[attribute];
			}

			function initCanvas() {
				testCanvas = angular.element("#test-canvas").get(0);
				testCanvasContext = testCanvas.getContext("2d");
			}

			function drawCanvas() {
				resetCanvas();
				drawCanvasBackground();
				drawCanvasForeground();
			}

			function resetCanvas() {
				// Clear the canvas everytime a chart is drawn
				testCanvasContext.clearRect(0, 0, testCanvas.width, testCanvas.height);
			}

			function drawCanvasBackground() {

				///////////////////////////////////////////////////////////////
				// PHASE BACKGROUND

				testCanvasContext.strokeStyle = _bgcolor;
				testCanvasContext.lineWidth = canvasLineWidth;

				//

				phaseCurrentAngle = phaseStartRadians; //

				testCanvasContext.beginPath();
				testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseInitSizeRadians, false); // init
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phaseInitSizeRadians + holeSize) % pi2; //

				testCanvasContext.beginPath();
				testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phasePingSizeRadians, false); // ping
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phasePingSizeRadians + holeSize) % pi2; //

				testCanvasContext.beginPath();
				testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseDownloadSizeRadians, false); // download
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phaseDownloadSizeRadians + holeSize) % pi2; //

				testCanvasContext.beginPath();
				testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseUploadSizeRadians, false); // upload
				testCanvasContext.stroke();

				// phase names
				testCanvasContext.fillStyle = _fgDark;
				testCanvasContext.font = phaseLegendTextFontSize + fontName;

				testCanvasContext.fillTextCircle(translateFilter("test.phase_abbreviation.init"),		phaseArcCenter.x, phaseArcCenter.y, phaseArcTextRadius, deg2rad(293),	true, true);
				testCanvasContext.fillTextCircle(translateFilter("test.phase_abbreviation.ping"),		phaseArcCenter.x, phaseArcCenter.y, phaseArcTextRadius, deg2rad(334),	true, true);
				testCanvasContext.fillTextCircle(translateFilter("test.phase_abbreviation.download"),	phaseArcCenter.x, phaseArcCenter.y, phaseArcTextRadius, deg2rad(8),		true, true);

				//Linter complaining for missing radix. Taking radix 10 as though of behaviour.
				uploadAngle = parseInt(translateFilter("test.phase_abbreviation.uploadAngle"), 10);
				testCanvasContext.fillTextCircle(translateFilter("test.phase_abbreviation.upload"),		phaseArcCenter.x, phaseArcCenter.y, phaseArcTextRadius, deg2rad(uploadAngle),	false, false);

				///////////////////////////////////////////////////////////////
				// PROGRESS BACKGROUND

				testCanvasContext.strokeStyle = _bgcolor;
				testCanvasContext.lineWidth = canvasLineWidth;

				testCanvasContext.beginPath();

				testCanvasContext.arc(progressArcCenter.x, progressArcCenter.y, arcRadius, progressStartRadians, progressEndRadians, false);

				testCanvasContext.stroke();

				///////////////////////////////////////////////////////////////
				// SPEED TEST SCALE

				testCanvasContext.fillStyle = _fgDark;
				testCanvasContext.font = phaseLegendTextFontSize + fontName;

				// draw 0,1
				testCanvasContext.fillTextCircle("0.1",	progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad(98), false, false);
				testCanvasContext.fillTextCircle("1",	progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad(98 + 72), false, false);
				testCanvasContext.fillTextCircle("10",	progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad(98 + 2 * 75.5), false, false);
				testCanvasContext.fillTextCircle("100",	progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad(98 + 3 * 71), true, true);
				testCanvasContext.fillTextCircle("1000",progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad((98 + 4 * 71.5) % 360), true, true);

				//////////////////////////

				testCanvasContext.strokeStyle = _bgcolor;
				testCanvasContext.lineWidth = scaleLineWidth;

				var quarterProgressEndDegrees = progressEndDegrees / 4;
				var curStartAngle = null;
				var a = null;
				var pointOnCircle = null;

				for (var s = progressLogScaleStart, i = 0; s <= progressLogScaleEnd && i < 4; s *= 10 && i++) {
					curStartAngle = quarterProgressEndDegrees * i;

					for (var n = 1; n < 10; n++) {
						var l = Math.log10(n);

						a = deg2rad(l * quarterProgressEndDegrees + curStartAngle);

						pointOnCircle = getPointOnCircle(arcRadius - canvasLineWidth / 2, progressArcCenter, a);

						drawLineInDirection(testCanvasContext, pointOnCircle, progressArcCenter, 13 - n);
					}
				}

				// draw last big line
				var lastPointOnCircle = getPointOnCircle(arcRadius - canvasLineWidth / 2, progressArcCenter, progressEndRadians);
				drawLineInDirection(testCanvasContext, lastPointOnCircle, progressArcCenter, 12);

				/////////////////////////////////////////////
				// draw QOS specific views

				if (testController.status == RMBTWebsocketTestState.QOS_TEST_RUNNING) {

					// qos progress scale
					testCanvasContext.fillStyle = _bgcolor;
					testCanvasContext.strokeStyle = _bgcolor;
					testCanvasContext.lineWidth = scaleLineWidth;
					testCanvasContext.font = phaseLegendTextFontSize + fontName;

					for (i = 0; i <= 5; i++) {
						curStartAngle = progressEndDegrees / 5 * i;

						var qosProgressText = (50 + 10 * (5 - i)) + "%";
						var qosProgressTextWidth = testCanvasContext.measureText(qosProgressText).width;

						var curAngleDiff = 99;
						if (i > 2) {
							curAngleDiff += 2;
						}

						testCanvasContext.fillTextCircle(qosProgressText, progressArcCenter.x, progressArcCenter.y, progressArcTextRadius, deg2rad(curStartAngle + curAngleDiff), false, (i > 2));

						///

						a = deg2rad(curStartAngle);
						pointOnCircle = getPointOnCircle(arcRadius - canvasLineWidth / 2, progressArcCenter, a);

						drawLineInDirection(testCanvasContext, pointOnCircle, progressArcCenter, 12);
					}

					// qos
					testCanvasContext.fillStyle = _fgDark;
					testCanvasContext.font = midArcTextFontSize + fontName;

					qosText = translateFilter("test.qos");

					qos_text_width = testCanvasContext.measureText(qosText).width;
					testCanvasContext.fillText(qosText, progressArcCenter.x - qos_text_width / 2, progressArcCenter.y + midArcTextFontSize / 2 - 10); // -10 for visual center
				}
			}

			function drawCanvasForeground() {

				//////////////////////////////
				// TEXT (TODO: add mbps text?)

				// percent text
				testCanvasContext.fillStyle = _fgLight;
				testCanvasContext.font = midArcTextFontSize + fontName;

				var progressText = Math.floor(_degrees_status / 360 * 100) + "%";

				var text_width = testCanvasContext.measureText(progressText).width;
				testCanvasContext.fillText(progressText, phaseArcCenter.x - text_width / 2, phaseArcCenter.y + midArcTextFontSize / 2 - arcRadius/15);

				/////////////////
				// PHASE GAUGE

				var radians1 = _degrees_status * Math.PI / 232; // TODO: why 232?

				testCanvasContext.lineWidth = canvasLineWidth;
				testCanvasContext.strokeStyle = _fgLight;

				//

				phaseCurrentAngle = phaseStartRadians; //

				// init
				testCanvasContext.beginPath();
				if (phaseStartRadians + radians1 > phaseCurrentAngle + phaseInitSizeRadians) { // draw full
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseInitSizeRadians, false); // init
				} else { // draw progress
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseStartRadians + radians1, false); // init
				}
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phaseInitSizeRadians + holeSize) % pi2; //

				// ping
				testCanvasContext.beginPath();
				if (phaseStartRadians + radians1 > phaseCurrentAngle + phasePingSizeRadians) { // draw full
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phasePingSizeRadians, false); // ping
				} else if (phaseStartRadians + radians1 > phaseCurrentAngle) { // draw progress
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseStartRadians + radians1, false); // ping
				}
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phasePingSizeRadians + holeSize) % pi2; //

				// download
				testCanvasContext.beginPath();
				if (phaseStartRadians + radians1 > phaseCurrentAngle + phaseDownloadSizeRadians) { // draw full
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseDownloadSizeRadians, false); // download
				} else if (phaseStartRadians + radians1 > phaseCurrentAngle) { // draw progress
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseStartRadians + radians1, false); // download
				}
				testCanvasContext.stroke();

				phaseCurrentAngle = (phaseCurrentAngle + phaseDownloadSizeRadians + holeSize) % pi2; //

				// upload (TODO: better logic for drawing)
				testCanvasContext.beginPath();
				if (testController.status == RMBTWebsocketTestState.UP) {
					//if (phaseStartRadians + radians1 < phaseCurrentAngle + phaseUploadSizeRadians) { // draw full
					//	testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseUploadSizeRadians, false); // upload
					//} else if (phaseStartRadians + radians1 > phaseCurrentAngle) { // draw progress
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle % pi2, (phaseStartRadians + radians1) % pi2, false); // upload
					//}
				} else if (testController.status == RMBTWebsocketTestState.END) {
					testCanvasContext.arc(phaseArcCenter.x, phaseArcCenter.y, arcRadius, phaseCurrentAngle, phaseCurrentAngle + phaseUploadSizeRadians, false); // upload
				}
				testCanvasContext.stroke();

				///////////////////////////////////////////////////////////////
				// PROGRESS GAUGE (speed and qos)

				testCanvasContext.strokeStyle = _fgDark;
				testCanvasContext.lineWidth = canvasLineWidth;

				testCanvasContext.beginPath();

				if (testController.status == RMBTWebsocketTestState.DOWN || testController.status == RMBTWebsocketTestState.UP) {
					// SPEED PROGRESS GAUGE

					var progressRadians = speedToLog(_currentSpeed) * progressEndRadians;
					testCanvasContext.arc(progressArcCenter.x, progressArcCenter.y, arcRadius, progressStartRadians, progressRadians, false);

				} else if (testController.status == RMBTWebsocketTestState.QOS_TEST_RUNNING) {
					// QOS PROGRESS GAUGE

					var qosProgressRadians = progressEndRadians * (1 - _qosProgress);
					testCanvasContext.arc(progressArcCenter.x, progressArcCenter.y, arcRadius, qosProgressRadians, progressEndRadians, false);
				}

				testCanvasContext.stroke();

				///////////////////////////////////////////////////////////////

				// ICONS: ping, download, upload
				if (_progressIconText) {
					testCanvasContext.fillStyle = _fgDark;
					testCanvasContext.font = iconFontSize + iconFontName;

					var iconWidth = testCanvasContext.measureText(_progressIconText).width;

					testCanvasContext.fillText(_progressIconText, progressArcCenter.x - iconWidth / 2, progressArcCenter.y + iconFontSize / 2 - arcRadius/10);
				}
			}

			function getSignificantDigits(number) {
				if (number > 100) {
					return -1;
				}
				else if (number >= 10) {
					return 0;
				}
				else if (number >= 1) {
					return 1;
				}
				else if (number >= 0.1) {
					return 2;
				}
				else {
					return 3;
				}
			}

			function progress_segment(status, progress) {
				var progressSegments = 0;

				switch (status) {
				case RMBTWebsocketTestState.INIT:
				case RMBTWebsocketTestState.INIT_DOWN:
					progressSegments = Math.round(ProgressSegmentsInit * progress);
					break;

				case RMBTWebsocketTestState.PING:
					progressSegments = ProgressSegmentsInit + Math.round(ProgressSegmentsPing * progress);
					break;

				case RMBTWebsocketTestState.DOWN:
					progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + Math.round(ProgressSegmentsDown * progress);
					break;

				case RMBTWebsocketTestState.INIT_UP:
					progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown;
					break;

				case RMBTWebsocketTestState.UP:
					progressSegments = ProgressSegmentsInit + ProgressSegmentsPing + ProgressSegmentsDown + Math.round(ProgressSegmentsUp * progress);
					break;

				case RMBTWebsocketTestState.END:
				case RMBTWebsocketTestState.QOS_TEST_RUNNING:
				case RMBTWebsocketTestState.SPEEDTEST_END:
				case RMBTWebsocketTestState.QOS_END:
					progressSegments = ProgressSegmentsTotal;
					break;

				case RMBTWebsocketTestState.ERROR:
				case RMBTWebsocketTestState.ABORTED:
					progressSegments = 0;
					break;

				default:
				// do nothing
				}

				var progressValue = progressSegments / ProgressSegmentsTotal;

				return progressValue;
			}

			function draw() {
				// check if test is still running
				if (!websocketTestClient || !websocketTestClient.isRunning()) {
					return;
				}

				var status, ping, down, up;
				var showup = "-", showdown = "-", showping = "-";

				///

				var result = websocketTestClient.getIntermediateResult();

				$scope.$apply(function () {
					testController.status = result.status;
				});

				lastStatus = result.status.toString();

				if (result !== null) {
					down = result.downBitPerSec;
					up = result.upBitPerSec;
					ping = result.pingNano;
					status = result.status.toString();
					progressPerPhase = result.progress;

					$log.trace("down: " + down + ", up: " + up + ", ping: " + ping + ", progressPerPhase: " + progressPerPhase + ", status: " + status);
				}

				// show-Strings
				if (ping > 0) {
					showping = (ping / 1000000);
					showping = showping.formatNumber(getSignificantDigits(showping)) + " " + "ms";

					$scope.$apply(function () {
						testController.ping = showping;
					});
				}

				if (down > 0) {
					showdown = (down / 1000000);
					showdown = showdown.formatNumber(getSignificantDigits(showdown)) + " " + "Mbps";

					$scope.$apply(function () {
						testController.downloadSpeed = showdown;
					});
				}

				if (up > 0) {
					showup = (up / 1000000);
					showup = showup.formatNumber(getSignificantDigits(showup)) + " " + "Mbps";

					$scope.$apply(function () {
						testController.uploadSpeed = showup;
					});
				}

				set_status(status);

				// update progress icon
				_progressIconText = _progressIconTypes[status] || false;

				///

				$log.trace(status + ": " + progressPerPhase);

				var prog = progress_segment(status, progressPerPhase);

				// Cancel any movement animation if a new chart is requested
				if (typeof _animation_loop !== undefined) {
					clearInterval(_animation_loop);
				}

				_new_degrees_status = Math.round(prog * 360) + 1; // TODO ????

				if (status == RMBTWebsocketTestState.DOWN) {
					_currentSpeed = down;

				} else if (status == RMBTWebsocketTestState.INIT_UP) {
					_currentSpeed = 0;

				} else if (status == RMBTWebsocketTestState.UP) {
					_currentSpeed = up;
				}

				_difference = Math.max(1, _new_degrees_status - _degrees_status);

				//This will animate the gauge to new positions
				//The animation will take 1 second
				//time for each frame is 1sec / difference in degrees
				_animation_loop = setInterval(animate_to, 500 / _difference);

				///

				if (status !== "END" && status !== "ERROR" && status !== "ABORTED") {
					_redraw_loop = setTimeout(draw, 250); // next draw loop
				}
			}

			function set_status(curStatus) {
				$scope.$apply(function () {
					testController.phase = translateFilter("test.phase." + curStatus);
				});
			}

			function animate_to() {
				// clear animation loop if degrees reaches to new_degrees
				if (_degrees_status >= _new_degrees_status) {
					clearInterval(_animation_loop);
				}

				if (_degrees_status < _new_degrees_status) {
					_degrees_status++;
				}

				// if the new degrees status is different from the old one
				// move the degrees_status forward to the old one so that
				// animation does not hang
				if (_old_degrees_status !== _new_degrees_status) {
					_degrees_status = _old_degrees_status;
					_old_degrees_status = _new_degrees_status;
				}

				drawCanvas();
			}

			//////

			WebsocketTestClientDelegate.prototype.reloadStatus = function() {
				//set_status(testController.status);
				$scope.$apply(function () {
					testController.phase = translateFilter("test.phase." + testController.status);
				});
			};

			WebsocketTestClientDelegate.prototype.updateInfo = function (test_server_name, client_remote_ip, provider, test_uuid) {
				$log.debug("ws delegate: " + test_server_name + ", " + client_remote_ip + ", " + provider + ", " + test_uuid);

				testController.serverName = test_server_name;
				testController.remoteIp = client_remote_ip;
				testController.providerName = provider;
				testController.testUuid = test_uuid;
			};

			WebsocketTestClientDelegate.prototype.testStarted = function () {
				$log.debug("ws delegate: testStarted");

				//first draw, then the timeout should kick in
				draw();
			};

			WebsocketTestClientDelegate.prototype.testFinished = function () {
				$log.debug("ws delegate: testFinished");

				if(userFactory.loopMode.isEnabled) {
					userFactory.loopModeNext();
					$state.go("home.index");
				} else {
					$state.go("home.historytest", {"testuuid": testController.testUuid});
				}
			};

			WebsocketTestClientDelegate.prototype.testFailed = function (error) {
				$log.debug("ws delegate: testFailed");

				// ng-show/ng-hide for test failed div

				$scope.$apply(function () {
					testController.testFailed = true;
				});
			};

			WebsocketTestClientDelegate.prototype.testDidStop = function (error) {
				$log.debug("ws delegate: testDidStop");
			};

			return WebsocketTestClientDelegate;
		})();

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		$rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
			// TODO: show alert if user really wants to quit the test by changing the state (need to find a way to prevent the state change, event.preventDefault() doesn't work...)

			if (websocketTestClient && websocketTestClient.isRunning()) {
				$log.info("stopping websocket test due to state change");

				websocketTestClient.stop();
			}
		});

		$scope.$on("handleLanguageChange", function(newLang) {
			delegate.reloadStatus();
		});

		testController.taAccepted = false;

		$scope.$on("termsAndConditionsAccepted", function() {
			testController.taAccepted = true;
		});

		$scope.$on("dataConsumptionWarningAccepted", function() {
			userFactory.getSettings(
			/*
		function (settings) {
			$log.debug("got settings");

			/////////////////

			geoTracker = null;
			//geoTracker = new RMBTWebsocketTestGeolocationTracker(testController);
			console.log(testController);
			console.log(geoTracker);

			config = null;
			config = new RMBTWebsocketTestConfig();
			console.log(config);
			config.advertised_speed = advertisedSpeedDataService.getAdvertisedSpeedDataForSubmit();
			console.log(config.advertised_speed);
			config.controlServerURL = MAIN.SERVER.CONTROL;
			config.timezone = userFactory.getTimezone();

			console.log(config);

			$log.info("using control server url " + config.controlServerURL);
			$log.info("using timezone " + config.timezone);

			config.uuid = userFactory.getUuid();
			delegate = null;
			
			delegate = new WebsocketTestClientDelegate();

			websocketTestClient = null;
			websocketTestClient = new RMBTWebsocketTestClient(config, delegate, geoTracker);
			console.log(websocketTestClient);
			$log.debug(config.uuid);

			websocketTestClient.startTest();
		},
		function (error) {
			$log.debug("getSettings failed");
		}
		*/
			);
		});
	}]);
