var GJAPI={};
GJAPI.iGameID    = 20444;   // # change this
GJAPI.sGameKey   = "-";     // # change this too
GJAPI.bAutoLogin = true;    // automatically log in users on Game Jolt

0!==GJAPI.iGameID&&""!==GJAPI.sGameKey||alert("Game ID or Game Key missing!");GJAPI.sAPI="https://gamejolt.com/api/game/v1";GJAPI.sLogName="[Game Jolt API]";GJAPI.iLogStack=20;GJAPI.asQueryParam=function(){for(var a={},f=window.location.search.substring(1).split("&"),c=0;c<f.length;++c){var b=f[c].split("=");"undefined"===typeof a[b[0]]?a[b[0]]=b[1]:"string"===typeof a[b[0]]?a[b[0]]=[a[b[0]],b[1]]:a[b[0]].push(b[1])}return a}();
GJAPI.bOnGJ=window.location.hostname.match(/gamejolt/)?!0:!1;GJAPI.LogTrace=function(a){GJAPI.iLogStack&&(--GJAPI.iLogStack||(a="(\u256f\u00b0\u25a1\u00b0\uff09\u256f\ufe35 \u253b\u2501\u253b"),console.warn(GJAPI.sLogName+" "+a),console.trace())};GJAPI.SEND_USER=!0;GJAPI.SEND_GENERAL=!1;GJAPI.SendRequest=function(a,f,c){GJAPI.SendRequestEx(a,f,"json","",c)};
GJAPI.SendRequestEx=function(a,f,c,b,d){a=GJAPI.sAPI+encodeURI(a)+(-1===a.indexOf("/?")?"?":"&")+"game_id="+GJAPI.iGameID+"&format="+c;GJAPI.bActive&&f===GJAPI.SEND_USER&&(a+="&username="+GJAPI.sUserName+"&user_token="+GJAPI.sUserToken);a+="&signature="+hex_md5(a+GJAPI.sGameKey);__CreateAjax(a,b,function(b){console.info(GJAPI.sLogName+" <"+a+"> "+b);if(""!==b&&"function"===typeof d)switch(c){case "json":d(eval("("+b+")").response);break;case "dump":var f=b.indexOf("\n"),h=b.substring(0,f-1);b=b.substring(f+
1);d({success:"SUCCESS"===h,data:b});break;default:d(b)}})};GJAPI.bActive=GJAPI.bAutoLogin&&GJAPI.asQueryParam.gjapi_username&&GJAPI.asQueryParam.gjapi_token?!0:!1;GJAPI.sUserName=GJAPI.bActive?GJAPI.asQueryParam.gjapi_username:"";GJAPI.sUserToken=GJAPI.bActive?GJAPI.asQueryParam.gjapi_token:"";console.info(GJAPI.asQueryParam);console.info(GJAPI.sLogName+(GJAPI.bOnGJ?" E":" Not e")+"mbedded on Game Jolt <"+window.location.origin+window.location.pathname+">");
console.info(GJAPI.sLogName+(GJAPI.bActive?" U":" No u")+"ser recognized <"+GJAPI.sUserName+">");window.location.hostname||console.warn(GJAPI.sLogName+" XMLHttpRequest may not work properly on a local environment");GJAPI.bSessionActive=!0;
GJAPI.SessionOpen=function(){GJAPI.bActive?GJAPI.iSessionHandle||GJAPI.SendRequest("/sessions/open/",GJAPI.SEND_USER,function(a){a.success&&(GJAPI.iSessionHandle=window.setInterval(GJAPI.SessionPing,3E4),window.addEventListener("beforeunload",GJAPI.SessionClose,!1))}):GJAPI.LogTrace("SessionOpen() failed: no user logged in")};GJAPI.SessionPing=function(){GJAPI.bActive?GJAPI.SendRequest("/sessions/ping/?status="+(GJAPI.bSessionActive?"active":"idle"),GJAPI.SEND_USER):GJAPI.LogTrace("SessionPing() failed: no user logged in")};
GJAPI.SessionClose=function(){GJAPI.bActive?(GJAPI.iSessionHandle&&(window.clearInterval(GJAPI.iSessionHandle),window.removeEventListener("beforeunload",GJAPI.SessionClose),GJAPI.iSessionHandle=0),GJAPI.SendRequest("/sessions/close/",GJAPI.SEND_USER)):GJAPI.LogTrace("SessionClose() failed: no user logged in")};GJAPI.bActive&&GJAPI.SessionOpen();
GJAPI.UserLoginManual=function(a,f,c){GJAPI.bActive?GJAPI.LogTrace("UserLoginManual("+a+", "+f+") failed: user "+GJAPI.sUserName+" already logged in"):GJAPI.SendRequest("/users/auth/?username="+a+"&user_token="+f,GJAPI.SEND_GENERAL,function(b){b.success&&(GJAPI.bActive=!0,GJAPI.sUserName=a,GJAPI.sUserToken=f,GJAPI.SessionOpen());"function"===typeof c&&c(b)},!1)};
GJAPI.UserLogout=function(){GJAPI.bActive?(GJAPI.SessionClose(),GJAPI.bActive=!1,GJAPI.sUserName="",GJAPI.sUserToken="",GJAPI.abTrophyCache={}):GJAPI.LogTrace("UserLogout() failed: no user logged in")};GJAPI.UserFetchID=function(a,f){GJAPI.SendRequest("/users/?user_id="+a,GJAPI.SEND_GENERAL,f)};GJAPI.UserFetchName=function(a,f){GJAPI.SendRequest("/users/?username="+a,GJAPI.SEND_GENERAL,f)};GJAPI.UserFetchCurrent=function(a){GJAPI.bActive?GJAPI.UserFetchName(GJAPI.sUserName,a):GJAPI.LogTrace("UserFetchCurrent() failed: no user logged in")};
GJAPI.abTrophyCache={};GJAPI.TROPHY_ONLY_ACHIEVED=1;GJAPI.TROPHY_ONLY_NOTACHIEVED=-1;GJAPI.TROPHY_ALL=0;GJAPI.TrophyAchieve=function(a,f){GJAPI.bActive?GJAPI.abTrophyCache[a]||GJAPI.SendRequest("/trophies/add-achieved/?trophy_id="+a,GJAPI.SEND_USER,function(c){c.success&&(GJAPI.abTrophyCache[a]=!0);"function"===typeof f&&f(c)}):GJAPI.LogTrace("TrophyAchieve("+a+") failed: no user logged in")};
GJAPI.TrophyFetch=function(a,f){GJAPI.bActive?GJAPI.SendRequest("/trophies/"+(a===GJAPI.TROPHY_ALL?"":"?achieved="+(a>=GJAPI.TROPHY_ONLY_ACHIEVED?"true":"false")),GJAPI.SEND_USER,f):GJAPI.LogTrace("TrophyFetch("+a+") failed: no user logged in")};GJAPI.TrophyFetchSingle=function(a,f){GJAPI.bActive?GJAPI.SendRequest("/trophies/?trophy_id="+a,GJAPI.SEND_USER,f):GJAPI.LogTrace("TrophyFetchSingle("+a+") failed: no user logged in")};GJAPI.SCORE_ONLY_USER=!0;GJAPI.SCORE_ALL=!1;
GJAPI.ScoreAdd=function(a,f,c,b,d){GJAPI.bActive?GJAPI.ScoreAddGuest(a,f,c,"",b,d):GJAPI.LogTrace("ScoreAdd("+a+", "+f+", "+c+") failed: no user logged in")};GJAPI.ScoreAddGuest=function(a,f,c,b,d,e){var g=b&&b.length?!0:!1;GJAPI.SendRequest("/scores/add/?sort="+f+"&score="+c+(g?"&guest="+b:"")+(a?"&table_id="+a:"")+(d?"&extra_data="+d:""),g?GJAPI.SEND_GENERAL:GJAPI.SEND_USER,e)};
GJAPI.ScoreFetch=function(a,f,c,b){!GJAPI.bActive&&f?GJAPI.LogTrace("ScoreFetch("+a+", "+f+", "+c+") failed: no user logged in"):GJAPI.SendRequest("/scores/?limit="+c+(a?"&table_id="+a:""),f!==GJAPI.SCORE_ONLY_USER?GJAPI.SEND_GENERAL:GJAPI.SEND_USER,b)};GJAPI.DATA_STORE_USER=0;GJAPI.DATA_STORE_GLOBAL=1;GJAPI.DataStoreSet=function(a,f,c,b){GJAPI.SendRequestEx("/data-store/set/?key="+f,a===GJAPI.DATA_STORE_USER,"json","data="+c,b)};
GJAPI.DataStoreFetch=function(a,f,c){GJAPI.SendRequestEx("/data-store/?key="+f,a===GJAPI.DATA_STORE_USER,"dump","",c)};GJAPI.DataStoreUpdate=function(a,f,c,b,d){GJAPI.SendRequest("/data-store/update/?key="+f+"&operation="+c+"&value="+b,a===GJAPI.DATA_STORE_USER,d)};GJAPI.DataStoreRemove=function(a,f,c){GJAPI.SendRequest("/data-store/remove/?key="+f,a===GJAPI.DATA_STORE_USER,c)};GJAPI.DataStoreGetKeys=function(a,f){GJAPI.SendRequest("/data-store/get-keys/",a===GJAPI.DATA_STORE_USER,f)};
function __CreateAjax(a,f,c){"string"!==typeof f&&(f="");if(window.XMLHttpRequest){var b=new XMLHttpRequest;b.onreadystatechange=function(){4===b.readyState&&c(b.responseText)};""!==f?(b.open("POST",a),b.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),b.send(f)):(b.open("GET",a),b.send())}else console.error(GJAPI.sLogName+" XMLHttpRequest not supported")}var hexcase=0;function hex_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)))}
function hex_hmac_md5(a,f){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(f)))}function md5_vm_test(){return"900150983cd24fb0d6963f7d28e17f72"==hex_md5("abc").toLowerCase()}function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),8*a.length))}
function rstr_hmac_md5(a,f){var c=rstr2binl(a);16<c.length&&(c=binl_md5(c,8*a.length));for(var b=Array(16),d=Array(16),e=0;16>e;e++)b[e]=c[e]^909522486,d[e]=c[e]^1549556828;c=binl_md5(b.concat(rstr2binl(f)),512+8*f.length);return binl2rstr(binl_md5(d.concat(c),640))}function rstr2hex(a){try{hexcase}catch(f){hexcase=0}for(var c=hexcase?"0123456789ABCDEF":"0123456789abcdef",b="",d,e=0;e<a.length;e++)d=a.charCodeAt(e),b+=c.charAt(d>>>4&15)+c.charAt(d&15);return b}
function str2rstr_utf8(a){for(var f="",c=-1,b,d;++c<a.length;)b=a.charCodeAt(c),d=c+1<a.length?a.charCodeAt(c+1):0,55296<=b&&56319>=b&&56320<=d&&57343>=d&&(b=65536+((b&1023)<<10)+(d&1023),c++),127>=b?f+=String.fromCharCode(b):2047>=b?f+=String.fromCharCode(192|b>>>6&31,128|b&63):65535>=b?f+=String.fromCharCode(224|b>>>12&15,128|b>>>6&63,128|b&63):2097151>=b&&(f+=String.fromCharCode(240|b>>>18&7,128|b>>>12&63,128|b>>>6&63,128|b&63));return f}
function rstr2binl(a){for(var f=Array(a.length>>2),c=0;c<f.length;c++)f[c]=0;for(c=0;c<8*a.length;c+=8)f[c>>5]|=(a.charCodeAt(c/8)&255)<<c%32;return f}function binl2rstr(a){for(var f="",c=0;c<32*a.length;c+=8)f+=String.fromCharCode(a[c>>5]>>>c%32&255);return f}
function binl_md5(a,f){a[f>>5]|=128<<f%32;a[(f+64>>>9<<4)+14]=f;for(var c=1732584193,b=-271733879,d=-1732584194,e=271733878,g=0;g<a.length;g+=16)var h=c,k=b,l=d,m=e,c=md5_ff(c,b,d,e,a[g+0],7,-680876936),e=md5_ff(e,c,b,d,a[g+1],12,-389564586),d=md5_ff(d,e,c,b,a[g+2],17,606105819),b=md5_ff(b,d,e,c,a[g+3],22,-1044525330),c=md5_ff(c,b,d,e,a[g+4],7,-176418897),e=md5_ff(e,c,b,d,a[g+5],12,1200080426),d=md5_ff(d,e,c,b,a[g+6],17,-1473231341),b=md5_ff(b,d,e,c,a[g+7],22,-45705983),c=md5_ff(c,b,d,e,a[g+8],7,
1770035416),e=md5_ff(e,c,b,d,a[g+9],12,-1958414417),d=md5_ff(d,e,c,b,a[g+10],17,-42063),b=md5_ff(b,d,e,c,a[g+11],22,-1990404162),c=md5_ff(c,b,d,e,a[g+12],7,1804603682),e=md5_ff(e,c,b,d,a[g+13],12,-40341101),d=md5_ff(d,e,c,b,a[g+14],17,-1502002290),b=md5_ff(b,d,e,c,a[g+15],22,1236535329),c=md5_gg(c,b,d,e,a[g+1],5,-165796510),e=md5_gg(e,c,b,d,a[g+6],9,-1069501632),d=md5_gg(d,e,c,b,a[g+11],14,643717713),b=md5_gg(b,d,e,c,a[g+0],20,-373897302),c=md5_gg(c,b,d,e,a[g+5],5,-701558691),e=md5_gg(e,c,b,d,a[g+
10],9,38016083),d=md5_gg(d,e,c,b,a[g+15],14,-660478335),b=md5_gg(b,d,e,c,a[g+4],20,-405537848),c=md5_gg(c,b,d,e,a[g+9],5,568446438),e=md5_gg(e,c,b,d,a[g+14],9,-1019803690),d=md5_gg(d,e,c,b,a[g+3],14,-187363961),b=md5_gg(b,d,e,c,a[g+8],20,1163531501),c=md5_gg(c,b,d,e,a[g+13],5,-1444681467),e=md5_gg(e,c,b,d,a[g+2],9,-51403784),d=md5_gg(d,e,c,b,a[g+7],14,1735328473),b=md5_gg(b,d,e,c,a[g+12],20,-1926607734),c=md5_hh(c,b,d,e,a[g+5],4,-378558),e=md5_hh(e,c,b,d,a[g+8],11,-2022574463),d=md5_hh(d,e,c,b,a[g+
11],16,1839030562),b=md5_hh(b,d,e,c,a[g+14],23,-35309556),c=md5_hh(c,b,d,e,a[g+1],4,-1530992060),e=md5_hh(e,c,b,d,a[g+4],11,1272893353),d=md5_hh(d,e,c,b,a[g+7],16,-155497632),b=md5_hh(b,d,e,c,a[g+10],23,-1094730640),c=md5_hh(c,b,d,e,a[g+13],4,681279174),e=md5_hh(e,c,b,d,a[g+0],11,-358537222),d=md5_hh(d,e,c,b,a[g+3],16,-722521979),b=md5_hh(b,d,e,c,a[g+6],23,76029189),c=md5_hh(c,b,d,e,a[g+9],4,-640364487),e=md5_hh(e,c,b,d,a[g+12],11,-421815835),d=md5_hh(d,e,c,b,a[g+15],16,530742520),b=md5_hh(b,d,e,
c,a[g+2],23,-995338651),c=md5_ii(c,b,d,e,a[g+0],6,-198630844),e=md5_ii(e,c,b,d,a[g+7],10,1126891415),d=md5_ii(d,e,c,b,a[g+14],15,-1416354905),b=md5_ii(b,d,e,c,a[g+5],21,-57434055),c=md5_ii(c,b,d,e,a[g+12],6,1700485571),e=md5_ii(e,c,b,d,a[g+3],10,-1894986606),d=md5_ii(d,e,c,b,a[g+10],15,-1051523),b=md5_ii(b,d,e,c,a[g+1],21,-2054922799),c=md5_ii(c,b,d,e,a[g+8],6,1873313359),e=md5_ii(e,c,b,d,a[g+15],10,-30611744),d=md5_ii(d,e,c,b,a[g+6],15,-1560198380),b=md5_ii(b,d,e,c,a[g+13],21,1309151649),c=md5_ii(c,
b,d,e,a[g+4],6,-145523070),e=md5_ii(e,c,b,d,a[g+11],10,-1120210379),d=md5_ii(d,e,c,b,a[g+2],15,718787259),b=md5_ii(b,d,e,c,a[g+9],21,-343485551),c=safe_add(c,h),b=safe_add(b,k),d=safe_add(d,l),e=safe_add(e,m);return[c,b,d,e]}function md5_cmn(a,f,c,b,d,e){return safe_add(bit_rol(safe_add(safe_add(f,a),safe_add(b,e)),d),c)}function md5_ff(a,f,c,b,d,e,g){return md5_cmn(f&c|~f&b,a,f,d,e,g)}function md5_gg(a,f,c,b,d,e,g){return md5_cmn(f&b|c&~b,a,f,d,e,g)}
function md5_hh(a,f,c,b,d,e,g){return md5_cmn(f^c^b,a,f,d,e,g)}function md5_ii(a,f,c,b,d,e,g){return md5_cmn(c^(f|~b),a,f,d,e,g)}function safe_add(a,f){var c=(a&65535)+(f&65535);return(a>>16)+(f>>16)+(c>>16)<<16|c&65535}function bit_rol(a,f){return a<<f|a>>>32-f};
