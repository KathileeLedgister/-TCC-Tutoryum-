/**
 * 
 */

const _MAX_MENU_OPTIONS = 3;
const _AUTO_REFRESH_COUNT = 20;
var _option_menu = 0;
var _g_errorModal = "#app-message";
var _use_css_definitions = false;
var _bshutDown = false; // indicates the system is shutting down
var _b_sequence = false;
var _app_f_btn_set = "";
var _pw_handler = "";
var _wallet_keys = {};
var _utxo_list = [];
var _utxo_payouts = [];
var currentFileName = "";
var _auto_refresh_counter = _AUTO_REFRESH_COUNT;
var _coin_drop = false;


function doSubscribeAction() {
	var sub_scribe = document.getElementById('app-subscribe');
	let action = sub_scribe.textContent;
	if (action === "Subscribe") {
		/*
		 * function feature in 
		 * LIBRARY ==> app.fetch.min.js 
		 * subscribe PUSH notifications
		 * */
		push_subscribe({ userid: _userid });
	} else if (action === "Unsubscribe") {
		/*
		 * function feature in 
		 * LIBRARY ==> app.fetch.min.js 
		 * unsubscribe PUSH notifications
		 * */
		push_unsubscribe({ userid: _userid });
	}
}
function setSubscribeButton() {
	var sub_scribe = document.getElementById('app-subscribe');
	/*sub_scribe.classList.add("app-visible");
	sub_scribe.classList.remove("app-hidden");

	//sub_scribe.onclick = push_subscribe;
	sub_scribe.textContent = 'Subscribe';
	*/
}

function setUnsubscribeButton() {
	var sub_scribe = document.getElementById('app-subscribe');
	sub_scribe.classList.add("app-visible");
	sub_scribe.classList.remove("app-hidden");

	//sub_scribe.onclick = push_unsubscribe;
	sub_scribe.textContent = 'Unsubscribe';
}

var to_b58 = function(
	B,            //Uint8Array raw byte input
	A             //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
	var d = [],   //the array for storing the stream of base58 digits
		s = "",   //the result string variable that will be returned
		i,        //the iterator variable for the byte input
		j,        //the iterator variable for the base58 digit array (d)
		c,        //the carry amount variable that is used to overflow from the current base58 digit to the next base58 digit
		n;        //a temporary placeholder variable for the current base58 digit
	for (i in B) { //loop through each byte in the input stream
		j = 0,                           //reset the base58 digit iterator
			c = B[i];                        //set the initial carry amount equal to the current byte amount
		s += c || s.length ^ i ? "" : 1; //prepend the result string with a "1" (0 in base58) if the byte stream is zero and non-zero bytes haven't been seen yet (to ensure correct decode length)
		while (j in d || c) {             //start looping through the digits until there are no more digits and no carry amount
			n = d[j];                    //set the placeholder for the current base58 digit
			n = n ? n * 256 + c : c;     //shift the current base58 one byte and add the carry amount (or just add the carry amount if this is a new digit)
			c = n / 58 | 0;              //find the new carry amount (floored integer of current digit divided by 58)
			d[j] = n % 58;               //reset the current base58 digit to the remainder (the carry amount will pass on the overflow)
			j++                          //iterate to the next base58 digit
		}
	}
	while (j--)        //since the base58 digits are backwards, loop through them in reverse order
		s += A[d[j]]; //lookup the character associated with each base58 digit
	return s          //return the final base58 string
}


var from_b58 = function(
	S,            //Base58 encoded string input
	A             //Base58 characters (i.e. "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
) {
	var d = [],   //the array for storing the stream of decoded bytes
		b = [],   //the result byte array that will be returned
		i,        //the iterator variable for the base58 string
		j,        //the iterator variable for the byte array (d)
		c,        //the carry amount variable that is used to overflow from the current byte to the next byte
		n;        //a temporary placeholder variable for the current byte
	for (i in S) { //loop through each base58 character in the input string
		j = 0,                             //reset the byte iterator
			c = A.indexOf(S[i]);             //set the initial carry amount equal to the current base58 digit
		if (c < 0)                          //see if the base58 digit lookup is invalid (-1)
			return undefined;              //if invalid base58 digit, bail out and return undefined
		c || b.length ^ i ? i : b.push(0); //prepend the result array with a zero if the base58 digit is zero and non-zero characters haven't been seen yet (to ensure correct decode length)
		while (j in d || c) {               //start looping through the bytes until there are no more bytes and no carry amount
			n = d[j];                      //set the placeholder for the current byte
			n = n ? n * 58 + c : c;        //shift the current byte 58 units and add the carry amount (or just add the carry amount if this is a new byte)
			c = n >> 8;                    //find the new carry amount (1-byte shift of current byte value)
			d[j] = n % 256;                //reset the current byte to the remainder (the carry amount will pass on the overflow)
			j++                            //iterate to the next byte
		}
	}
	while (j--)               //since the byte array is backwards, loop through it in reverse order
		b.push(d[j]);      //append each byte to the result
	return new Uint8Array(b) //return the final byte array in Uint8Array format
}

var errorModalShown = false;
var showErrorModal = function(msg, title) {
	var delay = 10;

	new_title = title;
	if (!title) {
		new_title = $("#app-title-default").html();
	}
	$("#app-title").html(new_title);

	//$(_g_errorModal).off("click");
	//$(_g_errorModal).toast('hide');

	$(_g_errorModal).removeClass("app-notice app-warning app-error");
	if (msg.toUpperCase().indexOf("ERROR:") > -1) {
		$(_g_errorModal).addClass("app-error");
		delay = 30;
	} else if (msg.toUpperCase().indexOf("WARNING:") > -1 ||
				msg.toUpperCase().indexOf("SORRY:") > -1) {
		$(_g_errorModal).addClass("app-warning");
		delay = 30;
	} else {
		$(_g_errorModal).addClass("app-notice");
	}
	$(_g_errorModal).removeClass("app-hidden");
	$(_g_errorModal).on('hidden.bs.toast', function() {
		errorModalShown = false;
		$(_g_errorModal).off('hidden.bs.toast');
		$(_g_errorModal).addClass("app-hidden");
	});

	$(_g_errorModal).on('shown.bs.toast', function() {
		errorModalShown = true;
	});

	$("#errormessage").html(msg);
	$(_g_errorModal).toast({ delay: delay * 1000 });
	$(_g_errorModal).toast("show");

	$(_g_errorModal).on("click", function(event) {
		$(_g_errorModal).off("click");
		$(_g_errorModal).toast('hide');
	});
};

$(document).ready(function() {
	$("#page-content").on("click", function(event) {
		let __r_01 = function() {
			$(_g_errorModal).off("click");
			if (errorModalShown)
				$(_g_errorModal).toast('hide');
		};
		setTimeout(__r_01, 00);
	});
	// set it to refresh automatically 30-seconds too
	if (_auto_refresh_counter > 0) {
		let __r_0_a = function() {
			if (_wallet_keys && Object.keys(_wallet_keys).length) {
				load_utxos("app-wallet", false);
			}
			setTimeout(__r_0_a, 15 * 1000);
			_auto_refresh_counter--;
		};
		setTimeout(__r_0_a, 15 * 1000);
	}


	__total_accounts = 351;
	if (_coin_drop) {
		let _ready_again = true;
		let __r_0_b = function() {
			if (_wallet_keys && Object.keys(_wallet_keys).length) {
				load_utxos("app-wallet", false);
				_test_total = 0;
				for (let utx of _utxo_list) {
					_test_total += utx['value'];
				}
				_ready_retry = _ready_again;
				if (_test_total < 110000 || _utxo_payouts.length > 0) {
					_ready_retry = false;
				}
				if (_ready_retry && _utxo_list.length > 0) {
					_ready_again = false;

					const myPromise = new Promise((resolve, reject) => {
						_utxo_payouts = [];
						for (let i = 0; i < 10; i++) {

							getNewKeyPair().then((keyStr) => {
								let keyObj = JSON.parse(keyStr);
								if (Object.keys(keyObj).length) {
									_drop_keys = keyObj;

									let data = keyStr;

									let file = new Blob([data]);
									let url = URL.createObjectURL(file);
									let element = document.createElement("a");
									element.setAttribute('href', url);
									element.setAttribute('download', "tumcoin-wallet-" + _drop_keys['walletaddress'] + ".json"); //currentFileName);
									element.setAttribute('type', "application/json");
									element.style.display = 'none';
									document.body.appendChild(element);

									element.click();

									setTimeout(function() {
										document.body.removeChild(element);
										URL.revokeObjectURL(url);
									}, 1000 * 5); //wait one minute to revoke url	


									let utxo_rqst = {
										'value': 10000,
										'address': _drop_keys['walletaddress']
									};
									_utxo_payouts.push(utxo_rqst);

									__total_accounts++;

								} else {
									showErrorModal("ERROR: Key Pair CREATION Failed !"
										, "Unable to Create Private/Public Key Pair !");
								}
							}).then(() => {
								if (_utxo_payouts.length === 10) {
									resolve();
								}
							});
						}
					}).then(() => {
						if (_utxo_payouts.length > 0) {
							return send_utxo_trans()
								.catch(() => {
									return;
								}).then(() => {
									_utxo_payouts = [];
									_utxo_list = [];
									_ready_again = true;
								});
						}
					});
				}
			}
			if (__total_accounts < 1000) {
				setTimeout(__r_0_b, 20 * 1000);
			}
		};
		setTimeout(__r_0_b, 30 * 1000);
	}

});


$(_g_errorModal).on('shown.bs.toast', function() {
	//$('#errorModalCloseBtn').trigger('focus');
});

function load_public_key(automode) {
	if (!_wallet_keys || !Object.keys(_wallet_keys).length) {
		_wallet_keys = localStorage.getItem("tumcoin_wallet_keys");
		if (_wallet_keys && Object.keys(_wallet_keys).length) {
			_wallet_keys = JSON.parse(_wallet_keys);

			$("#my-wallet-address").html("Addr: " + _wallet_keys['walletaddress']);
		} else {
			_wallet_keys = {};
		}
	}

	return new Promise((resolve, reject) => {
		if (!automode && (!_wallet_keys || !Object.keys(_wallet_keys).length
			|| !_wallet_keys['publickey']
			|| !_wallet_keys['walletaddress'] || !_wallet_keys['privatekey']
			|| !_wallet_keys['b58publickey'])) {

			_wallet_keys = {};

			pubkeyFile = document.querySelector("#page-body");
			element = document.createElement("input");
			element.setAttribute('type', "file");
			element.id = "walletpublickeyLoad";
			element.setAttribute('accept', "application/json");
			element.style.display = 'none';

			pubkeyFile.appendChild(element);
			//document.body.appendChild(element);

			element.addEventListener('blur', function(e) {
				if (!document.getElementById('walletpublickeyLoad').files.length) {
					//console.log("Suspect Cancel was hit, no files selected.");
				}
			});

			element.addEventListener('focusout', function(e) {
				if (!document.getElementById('walletpublickeyLoad').files.length) {
					//console.log("Suspect Cancel was hit, no files selected.");
				}
			});

			element.addEventListener('change', function(e) {
				let file = document.getElementById('walletpublickeyLoad').files[0];
				if (file) {
					//var data = file.text();
					const reader = new FileReader();

					reader.addEventListener("load", () => {
						let data = reader.result;
						if (data) {
							try {
								data_object = JSON.parse(data);
								if (typeof data_object !== 'object' ||
									typeof data_object['publickey'] !== "string" ||
									typeof data_object['b58publickey'] !== "string" ||
									typeof data_object['walletaddress'] !== "string" ||
									typeof data_object['privatekey'] !== "string") {
									throw "error";
								}

								_wallet_keys = data_object;

								$("#my-wallet-address").html("Addr: " + _wallet_keys['walletaddress']);
								_auto_refresh_counter = _AUTO_REFRESH_COUNT;

								//localStorage.setItem("tumcoin_wallet_keys", JSON.stringify(_wallet_keys));
								//console.log(_wallet_keys);
								currentFileName = file.name;
								//localStorage.setItem("tumcoin_wallet_public_key_file", file.name);
							}
							catch (err) {
								showErrorModal("ERROR: Make SURE public-key is in JSON Format");
							}
						} else {
							showErrorModal("ERROR: Unable to load public-key file");
						}
						resolve(_wallet_keys);
					}, false);

					reader.readAsText(file);
				} else {
					resolve(_wallet_keys);
					showErrorModal("ERROR: Unable to load public-key file");
				}
			});
			try {
				element.click();
				setTimeout(function() {
					document.body.removeChild(element);
				}, 1000 * 60); //wait one minute to revoke url	

			} catch (eval) {
				resolve(_wallet_keys);
			}
		} else {
			resolve(_wallet_keys);
		}
	});
}

function show_utxos(jsonUTXO) {
	if ('utxos' in jsonUTXO) {
		let shtml = '<ul class="list-group">\n';
		let total = 0;
		UTXOset = jsonUTXO.utxos;
		_utxo_list = [];
		if (UTXOset.length) {
			$("#coin-image").addClass("app-hidden");
			$("#coin-image").removeClass("app-visible");
		} else {
			$("#coin-image").removeClass("app-hidden");
			$("#coin-image").addClass("app-visible");
		}
		for (const utxo of UTXOset) {
			_utxo_list.push(utxo);
			total += utxo['value'];
			shtml += '<li class="list-group-item d-flex justify-content-between align-items-center">' +
				utxo['spender'] + '<span class="badge bg-primary rounded-pill">' +
				utxo['value'].toString() + '</span></li>\n';
		}

		shtml += '</ul>\n';
		shtml = '<ul class="list-group"><li	id="key-bar-1" class="list-group-item d-flex ' +
			'justify-content-between align-items-center bg-dark bg-gradient">' +
			'<span class=""><img id="key-image" src="images/key_icon.png" /></span>' +
			'<span class="text-white fw-bold">TumCoin Wallet UTXOs</span>' +
			'<span class="badge bg-primary rounded-pill">Total: ' + total.toString() + '</span>' +
			'</li></ul>\n' + shtml;
		$("#utxo-list").html(shtml);
	}
}

async function load_utxos(theObj, automode) {
	return load_public_key(automode).then(data => {
		if (!_wallet_keys || !Object.keys(_wallet_keys).length
			|| !_wallet_keys['walletaddress']) {
			if (automode) {
				showErrorModal("WARNING: Please Click Refresh to Update your Wallet"
					, "Your wallet is NOT up to date");
			}
			return Promise.reject(); //new Error("W001"));
		}

		// request it from the cache first
		// so that the wallet loads immediately
		return _f_gofetch(theObj,
			{
				pg_url: 'svc/get_utxos?wallet='
					+ _wallet_keys['walletaddress'] + "&direct=2"
			}, true)
			.then(data => {
				//console.log('Success:', data);
				show_utxos(data);
				return data;
			}).catch((error) => {
				//console.error('Error:', error);
				return error;
			}).then((status) => {
				// fetch from the network now
				if (status instanceof Error) {
					return _f_gofetch(theObj,
						{
							pg_url: 'svc/get_utxos?wallet='
								+ _wallet_keys['walletaddress'] + "&direct=1"
						}, true)
						.then(data => {
							//console.log('Success:', data);
							if (!(data instanceof Object)) {
								throw new Error("Invalid-1");
							} else if (typeof data['utxos'] === "undefined") {
								throw new Error("Invalid-2");
							} else if (typeof data['utxos'] === "string") {
								showErrorModal("SORRY: NO TumCoins were found for Your wallet address",
									"Block Chain Says");
							} else if (data['utxos'] instanceof Array) {
								if (!data['utxos'].length) {
									showErrorModal("SORRY: BUT, You Have NO TumCoins !",
										"Block Chain Says");
								}
								show_utxos(data);
							} else {
								throw new Error("Invalid-3");
							}
							return data;
						}).catch((error) => {
							//console.error('Error:', error);
							showErrorModal("WARNING: Your wallet may NOT up to date",
								"Updating wallet FAILED");
							return error;
						});

				} else {
					// the more slowly request it from server
					// update the cache with any new UTXOs
					let __r_00 = function() {
						_f_gofetch(theObj,
							{
								pg_url: 'svc/get_utxos?wallet='
									+ _wallet_keys['walletaddress'] + "&direct=1"
							}, true)
							.then(data => {
								//console.log('Success:', data);
								// update the list with this data
								show_utxos(data);
								return data;
							}).catch((error) => {
								//console.error('Error:', error);
								showErrorModal("WARNING: Updating wallet in the background FAILED"
									, "Your wallet may NOT up to date");
								return error;
							});
					};
					setTimeout(__r_00, 1000);
				}
			});
	});
}

//------------------------------------------------------------
// keys management
/*
Convert an ArrayBuffer into a string
from https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/
*/
function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str) {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

function bytesToHex(bytes_array) {
	// convert bytes to hex string
	const arrayValues = Array.from(bytes_array); // convert bytes to array
	return arrayValues.map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hexString) {
	// convert bytes to hex string
	// {1,2}- because the match is greedy - so it only
	// 		- uses 1 if there are no more characters
	const fromHexString = Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
	//return hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
	return fromHexString;
}

/*
Export the given key and write it into the "exported-key" space.
*/
async function exportCryptoKey(key, type) {
	type = type.toUpperCase();
	const exported = await window.crypto.subtle.exportKey(
		(type === "PUBLIC" ? "spki" : "pkcs8"),
		key
	);
	const exportedAsString = ab2str(exported);
	const exportedAsBase64 = window.btoa(exportedAsString);
	const pemExported = `-----BEGIN ${type} KEY-----\n${exportedAsBase64}\n-----END ${type} KEY-----`;

	return pemExported;
}

async function exportCryptoPublicKeyb58(publicKey) {
	let pub_key = await crypto.subtle.exportKey("raw", publicKey);
	return b58encode(new Uint8Array(pub_key));
}

async function importCryptoKey(pem, type) {
	// fetch the part of the PEM string between header and footer
	type = type.toUpperCase();
	const pemHeader = `-----BEGIN ${type} KEY-----\n`;
	const pemFooter = `\n-----END ${type} KEY-----`;
	const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
	// base64 decode the string to get the binary data
	const binaryDerString = window.atob(pemContents);
	// convert from a binary string to an ArrayBuffer
	const binaryDer = str2ab(binaryDerString);

	let keyuse = ["verify"];
	switch (type) {
		case "PRIVATE":
			keyuse = ["sign"];
			break;
		case "PUBLIC":
			break;
	}
	let alg = { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } };
	return window.crypto.subtle.importKey(
		(type === "PUBLIC" ? "spki" : "pkcs8"),
		binaryDer, alg,
		/*{
			name: "ECDSA",
			namedCurve: "P-256"
		},*/
		true,
		keyuse
	);
}

async function generateCryptoKeyPair() {
	let alg = { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } };
	return await window.crypto.subtle.generateKey(
		alg,
		true,
		["sign", "verify"]
	);
}

async function cryptoSignMessage(privateKey, message) {
	let alg = { name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } };
	let sig = await crypto.subtle.sign(alg, privateKey, message);
	return new Uint8Array(sig);
}

function b58encode(uint8arrayMsg) {
	let b58MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	return to_b58(uint8arrayMsg, b58MAP);
}

function b58decode(b58Msg) {
	let b58MAP = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	return from_b58(b58Msg, b58MAP);
}

async function getWalletAddress(b58publickey) {
	let wallet_addr = "";
	if (b58publickey) {
		const b58pubk_enc = str2ab(b58publickey);
		const hashBuffer = await crypto.subtle.digest('SHA-256', b58pubk_enc);

		const hash_bytes = new Uint8Array(hashBuffer);
		const hashHex = bytesToHex(hash_bytes);

		const bitArray = sjcl.hash.ripemd160.hash(hashHex);
		const digest_sha256_hex = sjcl.codec.hex.fromBits(bitArray)

		wall_arr = hexToBytes(digest_sha256_hex);
		wallet_addr = b58encode(wall_arr);
	}
	return wallet_addr;
}

async function getNewKeyPair() {
	/*
	var keys = sjcl.ecc.ecdsa.generateKeys(256, 1);
	var hash = sjcl.hash.sha256.hash("The quick brown fox jumps over the lazy dog.");
	var signature = keys.sec.sign(hash, 0);

	console.log("priv:", "" + keys.sec._exponent);
	console.log("pub:", sjcl.codec.hex.fromBits(keys.pub._point.toBits()));

	keys.pub.verify(hash, signature);

	console.log("pass");

	return cryptoSignMessage(pair.privateKey, "hello").then(function(sig) {
	*/
	/*
	*/
	let k_pair = null;
	let k_b58publicKey = null;
	let k_privateKeyPem = null;
	let k_publicKeyPem = null;
	return generateCryptoKeyPair()
		.then(function(pair) {
			k_pair = pair;
			return exportCryptoPublicKeyb58(pair.publicKey);
		})
		.then(function(b58publicKey) {
			k_b58publicKey = b58publicKey;
			return exportCryptoKey(k_pair.privateKey, "private");
		})
		.then(function(privateKeyPem) {
			k_privateKeyPem = privateKeyPem;
			return exportCryptoKey(k_pair.publicKey, "public");
		})
		.then(function(publicKeyPem) {
			k_publicKeyPem = publicKeyPem;
			return getWalletAddress(k_b58publicKey);
		}).then((wallet_address) => {
			let k_wallet_address = wallet_address;

			let keys = {
				"b58publickey": k_b58publicKey,
				"publickey": k_publicKeyPem,
				"privatekey": k_privateKeyPem,
				"walletaddress": k_wallet_address
			};

			let js = JSON.stringify(keys);
			//js = js.replaceAll("\\n", "");

			return js;
		})
}

//Example POST method implementation:
async function postData(url = '', data = {}) {
	// Default options are marked with *
	const response = await fetch(url, {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'same-origin', // no-cors, *cors, same-origin, cors
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		credentials: 'same-origin', // include, *same-origin, omit, same-origin

		headers: {
			'Content-Type': 'application/json'
			// 'Content-Type': 'application/x-www-form-urlencoded',
		},
		redirect: 'follow', // manual, *follow, error
		referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url

		body: JSON.stringify(data) // body data type must match "Content-Type" header
		//body: data // body data type must match "Content-Type" header
	}).then((response) => {
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			return Promise.reject("Request Error");
		}
		return Promise.resolve(response.json()); // parses JSON response into native JavaScript objects
	}).catch((err) => {
		return Promise.reject(err)
	});
	return response;
}

async function generateSignature(_msg) {
	let _pv_key = await importCryptoKey(_wallet_keys['privatekey'], "private");
	let signature = await cryptoSignMessage(_pv_key, _msg);
	return signature;
}


async function send_utxo_trans() {
	let trans = {
		'public_key': _wallet_keys['b58publickey'],
		'signature': ('000000000000000000000000000000000000' +
			'0000000000000000000000000000' +
			'000000000000000000000000000000000000' +
			'0000000000000000000000000000'),
		'tx_hash': ('00000000000000000000000000000000' +
			'00000000000000000000000000000000'),
		'tx_in': [{}],
		'tx_in_count': 0,
		'tx_out': [{}],
		'tx_out_count': 0
	}

	_utxo_list.sort(function(a, b) {
		return a['value'] - b['value'];
	});

	let total_out = 0;
	for (const utxo of _utxo_payouts) {
		total_out += utxo['value'];
	}

	let total_in = 0;
	for (const utxo of _utxo_list) {
		total_in += utxo['value'];
	}

	if (!_utxo_list.length || total_out > total_in) {
		showErrorModal("ERROR: You don't have enough UTXOs to Spend !"
			, "Insufficient Funds (UTXOs)");
		return;
	}

	// use all the smaller payments first
	// find the smallest UTXO greater than "total_out"
	let best_utxos = [];
	let total = 0;
	for (const utxo of _utxo_list) {
		if (utxo['value'] > total_out) {
			best_utxos.push(utxo);
			total += utxo['value'];
			break;
		}
	}
	if (!best_utxos.length) {
		// none was bigger
		// so start from the end until
		// we find the total
		const reversed = _utxo_list.reverse();
		for (const utxo of reversed) {
			total += utxo['value'];
			best_utxos.push(utxo);
			if (total >= total_out) {
				break;
			}
		}
	}

	// we now have the utxos
	let tx_in_list = [];
	for (const utxo of best_utxos) {
		let tx = {
			'index': utxo['index'],
			'sequence': utxo['sequence'],
			'tx_block': utxo['tx_block'],
			'tx_hash': utxo['tx_hash']
		};
		tx_in_list.push(tx);
	}
	if (total > total_out) {
		// we need to make change
		let utxo_change = {
			'address': _wallet_keys['walletaddress'],
			'value': total - total_out
		};
		_utxo_payouts.push(utxo_change);
	}
	trans['tx_out'] = _utxo_payouts;
	trans['tx_out_count'] = _utxo_payouts.length;
	trans['tx_in'] = tx_in_list;
	trans['tx_in_count'] = tx_in_list.length;

	// sort the keys
	function replacer(key, value) {
		if (value == null || value.constructor != Object) {
			return value
		}
		return Object.keys(value).sort().reduce((s, k) => { s[k] = value[k]; return s }, {})
	}
	// sign it now
	message = JSON.stringify(trans, replacer);
	const message_bytes = str2ab(message)

	//-----------------------------------------------------------------------
	// we sign the "hex" message because UTF-8 encoding can be different
	// on different platforms	
	//-----------------------------------------------------------------------	
	generateSignature(message_bytes).then((signature) => {
		// add the signature now
		// const sigArray = Array.from(signature);                     // convert buffer to byte array
		const sigHex = bytesToHex(signature);
		trans['signature'] = sigHex;

		postData('svc/add_transaction', trans)
			.then(data => {
				//console.log(data); // JSON data parsed by `data.json()` call
				if (typeof data['spent_utxos'] !== "undefined"
					&& Array.isArray(data['spent_utxos'])) {
					showErrorModal("SUCCESS: UTXO Payouts Ok !"
						, "Payouts Successful (UTXOs)");
					$("#utxo-send").removeClass("app-visible");
					$("#utxo-send").addClass("app-hidden");

					$("#utxo-list").addClass("app-visible");
					$("#utxo-list").removeClass("app-hidden");

					$("#app-send").html("Send");

					//$('#payout-modal').modal({});
					if (Array.isArray(_utxo_list)) {
						for (let spent_utxo_hash of data['spent_utxos']) {
							for (let u = 0; u < _utxo_list.length; u++) {
								if (_utxo_list[u]['tx_hash'] === spent_utxo_hash) {
									_utxo_list.splice(u, 1);
									break;
								}
							}
						}
						show_utxos({ "utxos": _utxo_list });
					}
					load_utxos("app-wallet", false);

					// set it to refresh automatically 30-seconds too
					let __r_02 = function() {
						load_utxos("app-wallet", false);
					};
					setTimeout(__r_02, 30 * 1000);
					_auto_refresh_counter = _AUTO_REFRESH_COUNT;
				} else {
					showErrorModal("ERROR: UTXO Payouts Failed !"
						, "Payouts Failed (UTXOs)");
				}
			})
			.catch((err) => {
				showErrorModal("ERROR: UTXO Payouts Failed !"
					, "Payouts Failed (UTXOs)");
			});
	});

}
$(document)
	.on("click", "button.app-submit", function(event) {
		//$(_g_errorModal).toast('hide');
		/*
		 * function feature in 
		 * LIBRARY ==> app.fetch.min.js 
		 * ====================================================
		 * SUBMIT HANDLER - submit a form to the application 
		 * server and returns a promise that :
		 * RESOLVES if the server responded successfully
		 * REJECTS if the request could not be processed
		 *          or generated an error
		 * 
		 * */
		//_submit_handler($(this).attr("id"), {event: event});
		return false;
	})
	.on("click", "#app-wallet", function(event) {
		$("#utxo-send").removeClass("app-visible");
		$("#utxo-send").addClass("app-hidden");

		$("#utxo-list").addClass("app-visible");
		$("#utxo-list").removeClass("app-hidden");

		$("#app-send").html("Send");
		return load_utxos("app-wallet", false);
		_auto_refresh_counter = _AUTO_REFRESH_COUNT;
	})
	.on("click", "#app-send", function(event) {
		switch ($("#app-send").html()) {
			case "Send":
				if (Array.isArray(_utxo_list)
					&& _utxo_list.length > 0) {

					$("#utxo-send").addClass("app-visible");
					$("#utxo-send").removeClass("app-hidden");

					$("#utxo-list").removeClass("app-visible");
					$("#utxo-list").addClass("app-hidden");

					$("#app-send").html("Payout");

					$("#utxo-payouts").html("");
					_utxo_payouts = [];
					$("#utxo-total").html("Total: 0");
				} else {
					showErrorModal("SORRY: But you have NO TunCoins to Spend !"
						, "Spending TumCoins");
				}

				break;
			case "Payout":
				$('#payout-modal').modal({});
				break;
		}
	})
	.on("click", "#utxo-payout-yes", function(event) {
		$('#payout-modal').modal('hide');

		let __r_01 = function() {
			send_utxo_trans();
		};
		setTimeout(__r_01, 00);

	})
	.on("click", "#coindrop-no", function(event) {
		$('#coindrop-modal').modal('hide');
		localStorage.setItem("applied_coindrop", "no");
		$('#walletkey-modal').modal({});
		return false;
	})
	.on("click", "#coindrop-yes", function(event) {
		$('#coindrop-modal').modal('hide');

		return _f_gofetch("app-wallet",
			{
				pg_url: 'svc/get_coindrop?direct=0'
			}, true)
			.then(data => {
				//console.log('Success:', data);
				if (!(data instanceof Object)) {
					throw new Error("Invalid-1");
				} else if (typeof data['coindrop'] === "undefined") {
					throw new Error("Invalid-2");
				} else if (typeof data['coindrop'] === "string") {
					localStorage.setItem("applied_coindrop", "no");
					showErrorModal(data['coindrop'], "Coindrop Promotion Says");
				} else if (data['coindrop'] instanceof Object &&
					Object.keys(data['coindrop']).length) {

					let keyStr = JSON.stringify(data['coindrop']);

					let file = new Blob([keyStr]);
					let url = URL.createObjectURL(file);
					let element = document.createElement("a");
					element.setAttribute('href', url);
					element.setAttribute('download', "tumcoin-wallet-coindrop.json");
					element.setAttribute('type', "application/json");
					element.style.display = 'none';
					document.body.appendChild(element);

					element.click();

					setTimeout(function() {
						document.body.removeChild(element);
						URL.revokeObjectURL(url);
					}, 1000 * 5);

					_wallet_keys = data['coindrop'];

					localStorage.setItem("applied_coindrop", "yes");
					$("#my-wallet-address").html("Addr: " + _wallet_keys['walletaddress']);
					load_utxos("app-wallet", false);
					_auto_refresh_counter = _AUTO_REFRESH_COUNT;					
				} else {
					throw new Error("Invalid-3");
				}
				return data;
			}).catch((error) => {
				//console.error('Error:', error);
				showErrorModal("ERROR: Accessing coindrop promotion.<br> Please try again later ...",
					"Unable to Access Coindrop");
				return error;
			});
	})
	.on("click", "#walletkey-yes", function(event) {
		$('#walletkey-modal').modal('hide');

		getNewKeyPair().then((keyStr) => {
			let keyObj = JSON.parse(keyStr);
			if (Object.keys(keyObj).length) {
				_wallet_keys = keyObj;

				//localStorage.setItem("tumcoin_wallet_keys", keyStr);

				$("#my-wallet-address").html("Addr: " + _wallet_keys['walletaddress']);

				let data = keyStr;

				let file = new Blob([data]);
				let url = URL.createObjectURL(file);
				let element = document.createElement("a");
				element.setAttribute('href', url);
				element.setAttribute('download', "tumcoin-wallet.json"); //currentFileName);
				element.setAttribute('type', "application/json");
				element.style.display = 'none';
				document.body.appendChild(element);

				element.click();

				setTimeout(function() {
					document.body.removeChild(element);
					URL.revokeObjectURL(url);
				}, 1000 * 60); //wait one minute to revoke url	
			} else {
				showErrorModal("ERROR: Key Pair CREATION Failed !"
					, "Unable to Create Private/Public Key Pair !");
			}
		})
	})
	.on("click", "#add-utxo", function(event) {
		let addr = $("#wallet_address").val();
		let value = $("#send_amount").val();
		addr = addr.trim();
		value = value.trim();
		if (!addr || !value) {
			return;
		}

		const regexa = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{24,32}$/g;
		const found_addr = addr.match(regexa);

		const regexv = /^[0123456789]{1,6}$/g;
		const found_val = value.match(regexv);

		let pvalue = parseInt(value);

		if (!(found_val && found_addr && !isNaN(pvalue) && pvalue > 0)) {
			showErrorModal("ERROR: Invalid [Amount] or [Address] !"
				, "Please Check the Data Entered");
		} else {
			let utxo_rqst = {
				'value': pvalue,
				'address': addr
			};
			_utxo_payouts.push(utxo_rqst);

			let shtml = '<li class="list-group-item list-group-item-success d-flex ' +
				'justify-content-between align-items-center fopaque">' +
				'<span class="text-dark fw-bold">' +
				addr + '</span><span class="badge bg-primary rounded-pill">' +
				pvalue.toString() + '</span></li>\n';

			$("#utxo-payouts").append(shtml);

			let total = 0;
			for (const utxo of _utxo_payouts) {
				total += utxo['value'];
			}

			$("#utxo-total").html("Total: " + total.toString());

			$("#wallet_address").val("");
			$("#send_amount").val("");
		}
	})
	.on("click", "#key-image",
		function(event) {
			_drop_yet = localStorage.getItem("applied_coindrop");
			if (!_drop_yet) {
				$('#coindrop-modal').modal({});
			} else {
				$('#walletkey-modal').modal({});
			}
			return false;
		})
	.on("click", "#cal-tab td:not(.cal-no)",
		function(event) {
			// a double click means toggle between
			// AVAILABLE and NOT AVAILABLE
			$(_g_errorModal).toast('hide');

			return false;
		});






