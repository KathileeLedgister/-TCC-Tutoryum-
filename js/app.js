/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * if your browser does not support FETCH us a POLYFILL
 * try : https://github.com/github/fetch
 * this is the recommended
 * The fetch() function is a Promise-based mechanism for programmatically making
 * web requests in the browser. This project is a polyfill that implements a subset
 * of the standard Fetch specification, enough to make fetch a viable replacement
 * for most uses of XMLHttpRequest in traditional web applications.
 * 
 * You will also need a Promise polyfill for older browsers. We recommend
 * taylorhakes/promise-polyfill for its small size and Promises/A+ compatibility.
 * 
 * <script src="js/fetch.umd.js"></script>
 * <script src="js/polyfill.min.js"></script>
 * 
 */
var _use_css_definitions = false;
var _bshutDown = false; // indicates the system is shutting down
var _b_sequence = false;
var _app_f_btn_set = "";
var _pw_handler = "";
var _userid = "";
var _usersession = -1;
var _userlevel = 0;
var __uuid = 0;
var _f_vTys = [0];
var _f_vTxs = [0];
var _f_eTs = [0];
var _f_dXTs = [0];
var _f_dYTs = [0];
var _f_t_c_back = "";
var _b_tc = false;

var _f_pre_submit = function(theObj, options) {
	return Promise.reject();
};
var _f_post_submit = function(theObj, options) {
	return Promise.reject();
};

var _f_set_pw = function() {
	$(document).on('click', _app_f_btn_set, function() {
		if (_g_errorModal) {
			$(_g_errorModal).toast('hide');
		}
		if (typeof _pw_handler === 'function') {
			_pw_handler();
		}
		return false;
	});
	_app_f_btn_set = "";
};

var _f_submit = function(theObj, options, quiet) {
	//options.event.preventDefault();
	//options.event.stopPropagation();

	var thisFormObj = document.getElementById('main-form');
	return new Promise((resolve, reject) => {

		$(thisFormObj).removeClass('was-validated');
		if (thisFormObj.checkValidity() === false) {
			$(thisFormObj).addClass('was-validated');
			reject(new Error("FORM_INVALID:"));
			return;
		}

		$(thisFormObj).addClass('was-validated');
		resolve();
	}).then(() => {
		var formData = new FormData(thisFormObj);

		let s_page = $("#" + theObj).attr("pg_url");
		let b_get = (typeof $("#" + theObj).attr("pg_get") !== "undefined");
		let pg_data = $("#" + theObj).attr("pg_data");
		if (!pg_data) {
			pg_data = "";
		}

		formData.append("_app_submitter", $("#" + theObj).attr("id"));
		if (!formData.has("userid"))
			formData.append("userid", _userid);
		formData.append("session", (options.session ? options.session : _usersession));
		formData.append("level", _userlevel);
		formData.append("uuid", __uuid);


		var data = "";
		var myRequest = "";

		if (!b_get) {
			data = new URLSearchParams(pg_data);
		}
		for (const pair of formData.entries()) {
			if (b_get) {
				data += "&" + encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
			} else {
				data.append(pair[0], pair[1]);
			}
		}

		if (b_get) {
			let myHeaders = new Headers();
			//myHeaders.append('Content-Type', 'application/x-www-form-urlencoded'); //application/json');
			myHeaders.append('Accept', 'text/plain;text/html;application/json');

			data = data.replace(/%20/g, '+');
			myRequest = new Request(s_page + "?"
				+ data.substr(1)
				+ (pg_data ? "&" + pg_data : "")
				, {
					method: 'GET', // *GET, POST, PUT, DELETE, etc.
					mode: 'same-origin', // no-cors, *cors, same-origin, cors
					cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
					headers: myHeaders,
					credentials: 'same-origin', // include, *same-origin, omit
					redirect: 'error', // manual, *follow, error
					referrerPolicy: 'no-referrer' //, // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
					//body: data //JSON.stringify(data)//body data type must match "Content-Type" header
				});
		} else {
			myRequest = new Request(s_page, {
				method: 'POST', // *GET, POST, PUT, DELETE, etc.
				mode: 'same-origin', // no-cors, *cors, same-origin, cors
				cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
				credentials: 'same-origin', // include, *same-origin, omit
				redirect: 'error', // manual, *follow, error
				referrerPolicy: 'no-referrer', //, // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
				body: data //JSON.stringify(data)//body data type must match "Content-Type" header
			});
		}

		return fetch(myRequest).then(response => {
			if (!response.ok) {
				throw new Error('REQUEST ERROR: Unable to process your request');
			}
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) { //'text/html'
				throw new TypeError("MALFORMED RESPONSE: Oops, we haven't got the correct format!");
			}
			let s_page_next = $("#" + theObj).attr("pg_url_next");
			if (s_page_next) {
				return _f_goload("undefined", { pg_url: s_page_next }).then(() => {
					return Promise.resolve(response.json());
				});
			} else {
				return Promise.resolve(response.json());
			}
		}).catch(error => {
			//console.error('Error:', error);
			// popup and error
			showErrorModal(error.message);
			return Promise.reject(error);
		});
	});
};

_submit_handler = function(theObj, options) {
	//console.log("submit :> " + $(this).attr("id"));
	if (!_b_sequence) {
		_b_sequence = true;

		var thisFormObj = document.getElementById('main-form');
		if (!thisFormObj) {
			_b_sequence = false;
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {
			_f_pre_submit(theObj, options).then(() => {
				resolve();
			}).catch((error) => {
				reject(error);
			});
		}).then(() => {
			thisFormObj.requestSubmit(); //submit();
			return _f_submit(theObj, options).then(response => {
				// the response if always a JSON object
				options.rpJson = response;
				return _f_post_submit(theObj, options).finally(() => {
					_b_sequence = false;
				});
			}).catch(() => {
				_b_sequence = false;
			})
		}).catch(error => {
			_b_sequence = false;
			return Promise.reject(error);
		});
	}
};
var _f_goload = function(theObj, options, quiet) {
	let s_page = $("#" + theObj).attr("pg_url");
	if (!s_page) {
		if (typeof options.pg_url !== "string") {
			// popup and error
			if (!quiet)
				showErrorModal("URLNOTFOUND: Unable to process request");
			return Promise.reject(new Error("URLNOTFOUND: Unable to process request"));
		}
		s_page = options.pg_url;
	}
	let allow_script_injection = $("#" + theObj).attr("allow_scripts");
	switch (s_page) {
		case "opt1":
			break;
		case "opt2":
			break;
	}

	let myHeaders = new Headers();
	myHeaders.append('Content-Type', 'text/plain;text/html');
	myHeaders.append('Accept', 'text/html');
	let myRequest = new Request(s_page, {
		method: 'GET', // *GET, POST, PUT, DELETE, etc.
		//method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'same-origin', // no-cors, *cors, same-origin, cors
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		credentials: 'same-origin', // include, *same-origin, omit
		headers: myHeaders,
		redirect: 'error', // manual, *follow, error
		referrerPolicy: 'no-referrer'//, // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		//body: JSON.stringify(formData) // body data type must match "Content-Type" header
	});
	return fetch(myRequest).then(response => {
		if (!response.ok) {
			throw new Error('REQUEST ERROR: Unable to process your request');
		}
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('text/html')) {
			throw new TypeError("MALFORMED RESPONSE: Oops, we haven't got the correct format!");
		}
		return response.text()
	}).then(response => {
		try {
			var pg_replace = false;
			//var page_html = '<div data-role="page" id="pg-preview"> Error' +
			//        response + '</div>';
			var page_html = response;
			if (!_bshutDown && response === null) {
				page_html = "Unknown Error";
				//$.mobile.loading('hide');
			} else if (!_bshutDown && typeof response === 'string' && response.substr(0, 6) === 'Error:') {
				///$.mobile.loading('hide');
			} else if (!_bshutDown && typeof response[1] === 'undefined') {
				//$.mobile.loading('hide');
			} else {
				pg_replace = true;
				//var oloader = $("div.ui-loader").detach();
				//$("#page-body").empty();
				//$("#page-body").append(oloader);
				page_html = response;
			}
			if (pg_replace) {
				//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				// this can be dangerous -- CHECK THE SCRIPTS TO BE OURS
				// SO SLICE THE HTML OURSELVES !!!!!
				// Do not use these methods to insert strings obtained 
				// from untrusted sources such as URL query parameters, 
				// cookies, or form inputs. Doing so can introduce 
				// cross-site-scripting (XSS) vulnerabilities
				//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


				//---------------------------------------------------------
				// this does not work is the HTML has mixed case "BODY"
				// in the tag. This must be checked MANUALLY for each page
				// 
				// The HTML MUST be properly formed for this to work !!!
				// Specifically: there must be a closing tag ">" and "<body>" tag
				//---------------------------------------------------------
				let i_body_offset = -1;
				if ((i_body_offset = page_html.indexOf("<body ")) === -1)
					if ((i_body_offset = page_html.indexOf("<BODY ")) === -1)
						throw new Error("MALFORMED HTML: <body tag not found in the page ... Developer Error.");
				page_html = page_html.substr(i_body_offset + "<body ".length);
				if ((i_body_offset = page_html.indexOf(">")) === -1)
					throw new Error("MALFORMED HTML: Body tag closing > expected ... Developer Error.");
				page_html = page_html.substr(i_body_offset + 1);
				if ((i_body_offset = page_html.lastIndexOf("</body")) === -1)
					if ((i_body_offset = page_html.lastIndexOf("</BODY")) === -1)
						throw new Error("MALFORMED HTML: </body tag not found in the page ... Developer Error.");
				page_html = page_html.substr(0, i_body_offset);
				try {
					//---------------------------------------------------------
					// page_html = the "inner" HTML of the body tag
					//---------------------------------------------------------
					$("#page-content").empty(); // delete the page texts

					//---------------------------------------------------------
					// we could use '$("#page-body").text()' to suppress code injection
					// however we will use a regular expression substitution
					// so we can encode the <script and </script to their HTML equivelant.
					// as <noscript and </noscript
					// we then add a class "suppressed-script" so that the developer
					// can decide how to display this script, we also add the css style 
					//---------------------------------------------------------
					if (!allow_script_injection) {
						page_html = page_html.replace(/<script[ ]/gi, "<noscript ").replace(/<\/script[ ]/gi, "</noscript ");
					}

					$("#page-content").prepend(page_html);
					if (!allow_script_injection) {
						$("#page-content noscript").addClass("suppressed-script");
						// however the developer wants to control the display
						if (!_use_css_definitions) {
							$("#page-content noscript").css({ display: "none" });
						}
					}

					if (_app_f_btn_set) {
						_f_set_pw();
					}
					return Promise.resolve();
				} catch (ex) {
					//===========================================================
					// HOW TO RECOVER ... what do we want to do here !!!
					//===========================================================
					// we place an error HTML on the page
					// A POPUP IS BETTER
					$("#page-content").prepend("UNKNOWN ERROR: Error Processing Page");
					throw new Error("UNKNOWN ERROR: Error Processing Page");
				}
			} else {
				//what is this option
				// this is for the developer to decide
				throw new Error("FEATURE NOT AVAILABLE: Error Processing Page");
			}
		} catch (ex) {
			throw new Error("UNKNOWN ERROR:");
		}
	}).catch((error) => {
		//console.error('Error:', error);
		// popup and error
		showErrorModal(error.message);

		return Promise.reject(error);
	});
};
var _f_gofetch = function(theObj, options, quiet) {
	var s_id = $("#" + theObj).attr("id");
	var s_url = (typeof options.pg_url === "string" ? options.pg_url : s_id);
	if (!s_url) {
		if (typeof options.pg_url !== "string" || !options.pg_url) {
			Promise.reject(new Error("URLNOTFOUND: Request NOT supported"));
		}
		s_url = options.pg_url;
	}
	switch (s_url) {
		case "opt1":
			break;
		case "opt2":
			break;
	}


	let pg_data = $("#" + theObj).attr("pg_data");
	if (!pg_data) {
		pg_data = "";
	}

	var searchdata = new URLSearchParams(pg_data);

	searchdata.append("_app_submitter", (s_id ? s_id :
		(typeof options.pg_id === "string" ? options.pg_id : "none")));
	if (!searchdata.has("userid"))
		searchdata.append("userid", _userid);
	searchdata.append("session", (options.session ? options.session : _usersession));
	searchdata.append("level", _userlevel);
	if (typeof __uuid !== "undefined")
		searchdata.append("uuid", __uuid);

	var data = "";
	var myRequest = "";

	for (const pair of searchdata.entries()) {
		data += "&" + encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]);
	}

	let myHeaders = new Headers();
	//myHeaders.append('Content-Type', 'application/x-www-form-urlencoded'); //application/json');
	myHeaders.append('Accept', 'application/json');

	data = data.replace(/%20/g, '+');
	// "?" set by function user !!!
	myRequest = new Request(s_url + data.substr((s_url.endsWith("?") ? 1 : 0)), {
		method: 'GET', // *GET, POST, PUT, DELETE, etc.
		mode: 'same-origin', // no-cors, *cors, same-origin, cors
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		headers: myHeaders,
		credentials: 'same-origin', // include, *same-origin, omit
		redirect: 'error', // manual, *follow, error
		referrerPolicy: 'no-referrer' //, // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		//body: data //JSON.stringify(data)//body data type must match "Content-Type" header
	});

	return fetch(myRequest).then(response => {
		if (!response.ok) {
			throw new Error('REQUEST ERROR: Unable to process your request');
		}
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) { //'text/html'
			throw new TypeError("MALFORMED RESPONSE: Oops, we haven't got the correct format!");
		}
		return Promise.resolve(response.json());
	}).catch(error => {
		//console.error('Error:', error);
		// popup and error
		if (!quiet)
			showErrorModal(error.message);
		return Promise.reject(error);
	});
};

function _set_TC_back(__cbf) {
	if (__cbf && !_f_t_c_back) {
		window.addEventListener("touchstart", handleStart, { passive: /*true*/false });
		window.addEventListener("touchmove", handleMove, { passive: /*true*/ false });
		//document.addEventListener("touchmove", onlyTouch, { passive: false});
		//window.addEventListener("click", onlyClick, { passive: false});
		//$(window).on("touchmove",{ passive: false}, onlyTouch);

		_f_t_c_back = __cbf;
	}
}

function _reset_TC_back(__cbf) {
	var __r_00 = function() {
		_set_TC_back(__cbf);
	};
	setTimeout(__r_00, 250);
}

function _clear_TC_back() {
	if (_f_t_c_back) {
		window.removeEventListener("touchstart", handleStart, { passive: /*true*/ false });
		window.removeEventListener("touchmove", handleMove, { passive: /*true*/ false });
		//document.addEventListener("touchmove", onlyTouch, { passive: false});
		//window.addEventListener("click", onlyClick, { passive: false});
		//$(window).on("touchmove",{ passive: false}, onlyTouch);

		_f_t_c_back = "";
	}
}

function handleStart(evt) {
	if (_f_t_c_back) {
		//evt.preventDefault();

		var touches = evt.changedTouches;
		var idx = 0;
		_f_vTxs[idx] = 0;
		_f_vTys[idx] = 0;
		_f_eTs[idx] = Date.now();
		_f_dXTs[idx] = touches[idx].pageX;
		_f_dYTs[idx] = touches[idx].pageY;
	}
}

function handleMove(evt) {
	if (_f_t_c_back) {
		//evt.preventDefault();

		var touches = evt.changedTouches;
		var dt = Date.now();
		var idx, dx, dy, velx, vely;
		idx = 0;

		if (dt - _f_eTs[idx] > 0) {
			dx = touches[idx].pageX - _f_dXTs[idx];
			dy = touches[idx].pageY - _f_dYTs[idx];

			velx = dx / (dt - _f_eTs[idx]);
			vely = dy / (dt - _f_eTs[idx]);
			_f_vTxs[idx] = (_f_vTxs[idx] * 20 + velx) / 21;
			_f_vTys[idx] = (_f_vTys[idx] * 20 + vely) / 21;

			_f_eTs[idx] = dt;
			_f_dXTs[idx] = touches[idx].pageX;
			_f_dYTs[idx] = touches[idx].pageY;

			if (!_b_tc) {
				_b_tc = true;
				var vtx = _f_vTxs[0];
				var vty = _f_vTys[0];
				var __r_01 = function() {
					_f_t_c_back(vtx, vty);
					_b_tc = false;
				};
				setTimeout(__r_01, 2);
			}
		}
	}
}

// This function is needed because Chrome doesn't accept a base64 encoded string
// as value for applicationServerKey in pushManager.subscribe yet
// https://bugs.chromium.org/p/chromium/issues/detail?id=802280
function urlBase64ToUint8Array(base64String) {
	var padding = '='.repeat((4 - base64String.length % 4) % 4);
	var base64 = (base64String + padding)
		.replace(/\-/g, '+')
		.replace(/_/g, '/');

	var rawData = window.atob(base64);
	var outputArray = new Uint8Array(rawData.length);

	for (var i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

// Get the `registration` from service worker and create a new
// subscription using `registration.pushManager.subscribe`. Then
// register received new subscription by sending a POST request with
// the subscription to the server.
function push_subscribe(options) {
	navigator.serviceWorker.ready.then(async function(registration) {
		// Get the server's public key
		const response = await fetch('api/vapidPublicKey', { method: 'GET' });
		const vapidPublicKey = await response.text();
		// Chrome doesn't accept the base64-encoded (string) vapidPublicKey yet
		// urlBase64ToUint8Array() is defined in /tools.js
		const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
		// Subscribe the user
		return registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: convertedVapidKey
		}).catch(error => {
			showErrorModal("WARNING: Subscription Registration Failed<br>" + error.message);
		});
	}).then(function(subscription) {
		console.log('Subscribed', subscription.endpoint);
		return fetch('api/register', {
			method: 'post',
			headers: {
				'Content-type': 'application/json'
			},
			body: JSON.stringify({
				subscription: subscription,
				options: options
			})
		});
	}).then(setUnsubscribeButton);
}

// Get existing subscription from service worker, unsubscribe
// (`subscription.unsubscribe()`) and unregister it in the server with
// a POST request to stop sending push messages to
// unexisting endpoint.
function push_unsubscribe(options) {
	navigator.serviceWorker.ready.then(
		function(registration) {
			return registration.pushManager.getSubscription();
		}).then(
			function(subscription) {
				return subscription.unsubscribe().then(
					function() {
						console.log('Unsubscribed', subscription.endpoint);
						return fetch('api/unregister', {
							method: 'post',
							headers: {
								'Content-type': 'application/json'
							},
							body: JSON.stringify({
								subscription: subscription,
								options: options
							})
						});
					});
			}).then(setSubscribeButton);
}
