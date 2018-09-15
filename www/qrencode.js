/*
       QR-Logo: http://qrlogo.kaarposoft.dk

       Copyright (C) 2011 Henrik Kaare Poulsen

       Licensed under the Apache License, Version 2.0 (the "License");
       you may not use this file except in compliance with the License.
       You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing, software
       distributed under the License is distributed on an "AS IS" BASIS,
       WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
       See the License for the specific language governing permissions and
       limitations under the License.
*/


/* ************************************************************ */
/* Settings for http://www.jslint.com/
** Note that we do NOT adhere to all jslint proposals
*/

/*jslint
	white,
	single,
	this,
	for,
	long,
	browser,
*/
/*global
	QRCodeDecode,
	Logger,
	Modernizr,
*/


/* ************************************************************ */
/* JavaScript STRICT mode
*/

"use strict";


/* ************************************************************ */
function qrencode_onload() {
	if (Modernizr.canvas && Modernizr.filereader) { document.getElementById("noHTML5canvas").style.display = "none"; }
}


/* ************************************************************ */
function qrencode_verify() {

	console.info("qrencode_verify: Verifying generated QR Code");
	console.time("qrencode_verify");

	var mode = parseInt(document.getElementById("qrlogo_mode").value, 10);
	var text = document.getElementById("qrlogo_text").value;
	var crlf = document.getElementById("qrlogo_crlf");
        crlf = crlf.options[crlf.selectedIndex].value;
        text = text_crlf_mode(text, crlf, mode);

	var qr = new QRCodeDecode();

	var debug = document.getElementById("qrlogo_debug_checkbox").checked;
	var logger;
	if (debug) {
		logger = new Logger("div_debug_output");
		logger.debug("<br><br><b>Verification</b><br>");
		qr.logger = logger;
	}

	var canvas = document.getElementById("qrlogo_canvas");
	var ctx = canvas.getContext("2d");
	var imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

	var decoded = qr.decodeImageData(imagedata, canvas.width, canvas.height);

	console.timeEnd("qrencode_verify");

	if (text !== decoded) { throw ("Decoded text does not match"); }
}


/* ************************************************************ */
function qrencode_onencode() {

	console.info("qrencode_onencode: Encoding text to QR Code");
	console.time("qrencode_onencode");

	let use_wasm = true;

	if (use_wasm) {
		console.info("qrencode_onencode: using WASM");
		var debug = document.getElementById("qrlogo_debug_checkbox").checked;
		if (debug) {
			qrlogo_wasm.set_loglevel(3);
		} else {
			qrlogo_wasm.set_loglevel(1);
		}
		var text = document.getElementById("qrlogo_text").value;
		var crlf = document.getElementById("qrlogo_crlf");
		crlf = crlf.options[crlf.selectedIndex].value;
		text = text_crlf_mode(text, crlf, mode);
		var mode = parseInt(document.getElementById("qrlogo_mode").value, 10);
		var ec_level = parseInt(document.getElementById("qrlogo_errorcorrection").value, 10);
		var version = qrlogo_wasm.version_from_length(text.length, mode, ec_level);
		console.log("version " + version);
		if (version == undefined) { throw new Error("text too long") }
		var canvas = document.getElementById("qrlogo_canvas");
		var ctx = canvas.getContext("2d");
		var pix_per_module = parseInt(document.getElementById("qrlogo_pixpermodule").value, 10);
		var bg_color_str = document.getElementById("qrlogo_bg_color").jscolor.toHEXString();
		var module_color_str = document.getElementById("qrlogo_module_color").jscolor.toHEXString();
		qrlogo_wasm.encode_to_canvas(text, version, mode, ec_level, ctx, bg_color_str, module_color_str, pix_per_module);
	} else {
		var qr = new QRCodeDecode();

		var canvas = document.getElementById("qrlogo_canvas");
		var bg_color = document.getElementById("qrlogo_bg_color").jscolor.rgb;
		var module_color = document.getElementById("qrlogo_module_color").jscolor.rgb;

		var mode = parseInt(document.getElementById("qrlogo_mode").value, 10);
		var error_correction_level = parseInt(document.getElementById("qrlogo_errorcorrection").value, 10);
		var text = document.getElementById("qrlogo_text").value;
		var crlf = document.getElementById("qrlogo_crlf");
		crlf = crlf.options[crlf.selectedIndex].value;
		text = text_crlf_mode(text, crlf, mode);
		var pixpermodule = parseInt(document.getElementById("qrlogo_pixpermodule").value, 10);

		var version = qr.getVersionFromLength(error_correction_level, mode, text.length);

		var debug = document.getElementById("qrlogo_debug_checkbox").checked;
		var logger = null;
		if (debug) {
			logger = new Logger("div_debug_output");
			logger.init();
			qr.logger = logger;
			document.getElementById("div_debug").style.display = "block";
		}

		qr.encodeToCanvas(mode, text, version, error_correction_level, pixpermodule, canvas, bg_color, module_color);
	}

	document.getElementById("qrlogo_version").innerHTML = version.toString();
	document.getElementById("div_encoded").style.display = "block";

	console.timeEnd("qrencode_onencode");

	setTimeout(qrencode_verify, 0);
}


/* ************************************************************ */
function qrencode_download() {
	document.location.href = document.getElementById("qrlogo_canvas").toDataURL().replace("image/png", "image/octet-stream");
	return false;
}

/* ************************************************************ */
function on_qrlogo_wasm_loaded () {
        console.log("on_qrlogo_wasm_loaded: LOADED");
        document.getElementById("button_encode").style.display = "block";

}

/* ************************************************************ */
if (qrlogo_wasm_loaded) {
        console.log("waiting for qrlogo_wasm_loaded");
        qrlogo_wasm_loaded.then(()=>on_qrlogo_wasm_loaded());
} else {
        console.error("qrlogo_wasm_loaded not set");
}