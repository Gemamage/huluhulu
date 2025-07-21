(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6450],{4444:function(e,t,n){"use strict";n.d(t,{$s:function(){return T},BH:function(){return m},L:function(){return l},LL:function(){return S},ZR:function(){return I},aH:function(){return g},eu:function(){return y},hl:function(){return b},m9:function(){return D},ru:function(){return w},vZ:function(){return function e(t,n){if(t===n)return!0;let i=Object.keys(t),r=Object.keys(n);for(let a of i){if(!r.includes(a))return!1;let i=t[a],o=n[a];if(E(i)&&E(o)){if(!e(i,o))return!1}else if(i!==o)return!1}for(let e of r)if(!i.includes(e))return!1;return!0}},zI:function(){return v}});var i=n(4155);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let r=function(e){let t=[],n=0;for(let i=0;i<e.length;i++){let r=e.charCodeAt(i);r<128?t[n++]=r:(r<2048?t[n++]=r>>6|192:((64512&r)==55296&&i+1<e.length&&(64512&e.charCodeAt(i+1))==56320?(r=65536+((1023&r)<<10)+(1023&e.charCodeAt(++i)),t[n++]=r>>18|240,t[n++]=r>>12&63|128):t[n++]=r>>12|224,t[n++]=r>>6&63|128),t[n++]=63&r|128)}return t},a=function(e){let t=[],n=0,i=0;for(;n<e.length;){let r=e[n++];if(r<128)t[i++]=String.fromCharCode(r);else if(r>191&&r<224){let a=e[n++];t[i++]=String.fromCharCode((31&r)<<6|63&a)}else if(r>239&&r<365){let a=((7&r)<<18|(63&e[n++])<<12|(63&e[n++])<<6|63&e[n++])-65536;t[i++]=String.fromCharCode(55296+(a>>10)),t[i++]=String.fromCharCode(56320+(1023&a))}else{let a=e[n++],o=e[n++];t[i++]=String.fromCharCode((15&r)<<12|(63&a)<<6|63&o)}}return t.join("")},o={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();let n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let t=0;t<e.length;t+=3){let r=e[t],a=t+1<e.length,o=a?e[t+1]:0,s=t+2<e.length,c=s?e[t+2]:0,l=r>>2,u=(3&r)<<4|o>>4,d=(15&o)<<2|c>>6,f=63&c;s||(f=64,a||(d=64)),i.push(n[l],n[u],n[d],n[f])}return i.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(r(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):a(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();let n=t?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let t=0;t<e.length;){let r=n[e.charAt(t++)],a=t<e.length?n[e.charAt(t)]:0,o=++t<e.length?n[e.charAt(t)]:64,c=++t<e.length?n[e.charAt(t)]:64;if(++t,null==r||null==a||null==o||null==c)throw new s;let l=r<<2|a>>4;if(i.push(l),64!==o){let e=a<<4&240|o>>2;if(i.push(e),64!==c){let e=o<<6&192|c;i.push(e)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class s extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}let c=function(e){let t=r(e);return o.encodeByteArray(t,!0)},l=function(e){return c(e).replace(/\./g,"")},u=function(e){try{return o.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null},d=()=>/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if(void 0!==n.g)return n.g;throw Error("Unable to locate global object.")})().__FIREBASE_DEFAULTS__,f=()=>{if(void 0===i||void 0===i.env)return;let e=i.env.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},h=()=>{let e;if("undefined"==typeof document)return;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}let t=e&&u(e[1]);return t&&JSON.parse(t)},p=()=>{try{return d()||f()||h()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},g=()=>{var e;return null===(e=p())||void 0===e?void 0:e.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),"function"==typeof e&&(this.promise.catch(()=>{}),1===e.length?e(t):e(t,n))}}}function w(){let e="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof e&&void 0!==e.id}function b(){try{return"object"==typeof indexedDB}catch(e){return!1}}function y(){return new Promise((e,t)=>{try{let n=!0,i="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(i);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(i),e(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{var e;t((null===(e=r.error)||void 0===e?void 0:e.message)||"")}}catch(e){t(e)}})}function v(){return"undefined"!=typeof navigator&&!!navigator.cookieEnabled}class I extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,I.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,S.prototype.create)}}class S{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){let n=t[0]||{},i=`${this.service}/${e}`,r=this.errors[e],a=r?r.replace(_,(e,t)=>{let i=n[t];return null!=i?String(i):`<${t}?>`}):"Error",o=`${this.serviceName}: ${a} (${i}).`;return new I(i,o,n)}}let _=/\{\$([^}]+)}/g;function E(e){return null!==e&&"object"==typeof e}function T(e,t=1e3,n=2){let i=t*Math.pow(n,e);return Math.min(144e5,i+Math.round(.5*i*(Math.random()-.5)*2))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function D(e){return e&&e._delegate?e._delegate:e}},4155:function(e){var t,n,i,r=e.exports={};function a(){throw Error("setTimeout has not been defined")}function o(){throw Error("clearTimeout has not been defined")}function s(e){if(t===setTimeout)return setTimeout(e,0);if((t===a||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(n){try{return t.call(null,e,0)}catch(n){return t.call(this,e,0)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:a}catch(e){t=a}try{n="function"==typeof clearTimeout?clearTimeout:o}catch(e){n=o}}();var c=[],l=!1,u=-1;function d(){l&&i&&(l=!1,i.length?c=i.concat(c):u=-1,c.length&&f())}function f(){if(!l){var e=s(d);l=!0;for(var t=c.length;t;){for(i=c,c=[];++u<t;)i&&i[u].run();u=-1,t=c.length}i=null,l=!1,function(e){if(n===clearTimeout)return clearTimeout(e);if((n===o||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(e);try{n(e)}catch(t){try{return n.call(null,e)}catch(t){return n.call(this,e)}}}(e)}}function h(e,t){this.fun=e,this.array=t}function p(){}r.nextTick=function(e){var t=Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];c.push(new h(e,t)),1!==c.length||l||s(f)},h.prototype.run=function(){this.fun.apply(null,this.array)},r.title="browser",r.browser=!0,r.env={},r.argv=[],r.version="",r.versions={},r.on=p,r.addListener=p,r.once=p,r.off=p,r.removeListener=p,r.removeAllListeners=p,r.emit=p,r.prependListener=p,r.prependOnceListener=p,r.listeners=function(e){return[]},r.binding=function(e){throw Error("process.binding is not supported")},r.cwd=function(){return"/"},r.chdir=function(e){throw Error("process.chdir is not supported")},r.umask=function(){return 0}},2238:function(e,t,n){"use strict";n.d(t,{C6:function(){return _},KN:function(){return E},Mq:function(){return S},Xd:function(){return w},ZF:function(){return I},qX:function(){return b}});var i=n(8463),r=n(3333),a=n(4444),o=n(6531);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class s{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(!function(e){let t=e.getComponent();return(null==t?void 0:t.type)==="VERSION"}(e))return null;{let t=e.getImmediate();return`${t.library}/${t.version}`}}).filter(e=>e).join(" ")}}let c="@firebase/app",l="0.10.13",u=new r.Yd("@firebase/app"),d="[DEFAULT]",f={[c]:"fire-core","@firebase/app-compat":"fire-core-compat","@firebase/analytics":"fire-analytics","@firebase/analytics-compat":"fire-analytics-compat","@firebase/app-check":"fire-app-check","@firebase/app-check-compat":"fire-app-check-compat","@firebase/auth":"fire-auth","@firebase/auth-compat":"fire-auth-compat","@firebase/database":"fire-rtdb","@firebase/data-connect":"fire-data-connect","@firebase/database-compat":"fire-rtdb-compat","@firebase/functions":"fire-fn","@firebase/functions-compat":"fire-fn-compat","@firebase/installations":"fire-iid","@firebase/installations-compat":"fire-iid-compat","@firebase/messaging":"fire-fcm","@firebase/messaging-compat":"fire-fcm-compat","@firebase/performance":"fire-perf","@firebase/performance-compat":"fire-perf-compat","@firebase/remote-config":"fire-rc","@firebase/remote-config-compat":"fire-rc-compat","@firebase/storage":"fire-gcs","@firebase/storage-compat":"fire-gcs-compat","@firebase/firestore":"fire-fst","@firebase/firestore-compat":"fire-fst-compat","@firebase/vertexai-preview":"fire-vertex","fire-js":"fire-js",firebase:"fire-js-all"},h=new Map,p=new Map,g=new Map;function m(e,t){try{e.container.addComponent(t)}catch(n){u.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function w(e){let t=e.name;if(g.has(t))return u.debug(`There were multiple attempts to register component ${t}.`),!1;for(let n of(g.set(t,e),h.values()))m(n,e);for(let t of p.values())m(t,e);return!0}function b(e,t){let n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}let y=new a.LL("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."});/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v{constructor(e,t,n){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new i.wA("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw y.create("app-deleted",{appName:this._name})}}function I(e,t={}){let n=e;"object"!=typeof t&&(t={name:t});let r=Object.assign({name:d,automaticDataCollectionEnabled:!1},t),o=r.name;if("string"!=typeof o||!o)throw y.create("bad-app-name",{appName:String(o)});if(n||(n=(0,a.aH)()),!n)throw y.create("no-options");let s=h.get(o);if(s){if((0,a.vZ)(n,s.options)&&(0,a.vZ)(r,s.config))return s;throw y.create("duplicate-app",{appName:o})}let c=new i.H0(o);for(let e of g.values())c.addComponent(e);let l=new v(n,r,c);return h.set(o,l),l}function S(e=d){let t=h.get(e);if(!t&&e===d&&(0,a.aH)())return I();if(!t)throw y.create("no-app",{appName:e});return t}function _(){return Array.from(h.values())}function E(e,t,n){var r;let a=null!==(r=f[e])&&void 0!==r?r:e;n&&(a+=`-${n}`);let o=a.match(/\s|\//),s=t.match(/\s|\//);if(o||s){let e=[`Unable to register library "${a}" with version "${t}":`];o&&e.push(`library name "${a}" contains illegal characters (whitespace or "/")`),o&&s&&e.push("and"),s&&e.push(`version name "${t}" contains illegal characters (whitespace or "/")`),u.warn(e.join(" "));return}w(new i.wA(`${a}-version`,()=>({library:a,version:t}),"VERSION"))}let T="firebase-heartbeat-store",D=null;function C(){return D||(D=(0,o.X3)("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)try{e.createObjectStore(T)}catch(e){console.warn(e)}}}).catch(e=>{throw y.create("idb-open",{originalErrorMessage:e.message})})),D}async function A(e){try{let t=(await C()).transaction(T),n=await t.objectStore(T).get(O(e));return await t.done,n}catch(e){if(e instanceof a.ZR)u.warn(e.message);else{let t=y.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});u.warn(t.message)}}}async function k(e,t){try{let n=(await C()).transaction(T,"readwrite"),i=n.objectStore(T);await i.put(t,O(e)),await n.done}catch(e){if(e instanceof a.ZR)u.warn(e.message);else{let t=y.create("idb-set",{originalErrorMessage:null==e?void 0:e.message});u.warn(t.message)}}}function O(e){return`${e.name}!${e.options.appId}`}class L{constructor(e){this.container=e,this._heartbeatsCache=null;let t=this.container.getProvider("app").getImmediate();this._storage=new N(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){var e,t;try{let n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=M();if((null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,(null===(t=this._heartbeatsCache)||void 0===t?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(e=>e.date===i))return;return this._heartbeatsCache.heartbeats.push({date:i,agent:n}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(e=>{let t=new Date(e.date).valueOf();return Date.now()-t<=2592e6}),this._storage.overwrite(this._heartbeatsCache)}catch(e){u.warn(e)}}async getHeartbeatsHeader(){var e;try{if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,(null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)==null||0===this._heartbeatsCache.heartbeats.length)return"";let t=M(),{heartbeatsToSend:n,unsentEntries:i}=function(e,t=1024){let n=[],i=e.slice();for(let r of e){let e=n.find(e=>e.agent===r.agent);if(e){if(e.dates.push(r.date),j(n)>t){e.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),j(n)>t){n.pop();break}i=i.slice(1)}return{heartbeatsToSend:n,unsentEntries:i}}(this._heartbeatsCache.heartbeats),r=(0,a.L)(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(e){return u.warn(e),""}}}function M(){return new Date().toISOString().substring(0,10)}class N{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,a.hl)()&&(0,a.eu)().then(()=>!0).catch(()=>!1)}async read(){if(!await this._canUseIndexedDBPromise)return{heartbeats:[]};{let e=await A(this.app);return(null==e?void 0:e.heartbeats)?e:{heartbeats:[]}}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){let n=await this.read();return k(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){let n=await this.read();return k(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function j(e){return(0,a.L)(JSON.stringify({version:2,heartbeats:e})).length}w(new i.wA("platform-logger",e=>new s(e),"PRIVATE")),w(new i.wA("heartbeat",e=>new L(e),"PRIVATE")),E(c,l,""),E(c,l,"esm2017"),E("fire-js","")},8463:function(e,t,n){"use strict";n.d(t,{H0:function(){return s},wA:function(){return r}});var i=n(4444);class r{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let a="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class o{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){let t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){let e=new i.BH;if(this.instancesDeferred.set(t,e),this.isInitialized(t)||this.shouldAutoInitialize())try{let n=this.getOrInitializeService({instanceIdentifier:t});n&&e.resolve(n)}catch(e){}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;let n=this.normalizeInstanceIdentifier(null==e?void 0:e.identifier),i=null!==(t=null==e?void 0:e.optional)&&void 0!==t&&t;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(e){if(i)return null;throw e}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if("EAGER"===e.instantiationMode)try{this.getOrInitializeService({instanceIdentifier:a})}catch(e){}for(let[e,t]of this.instancesDeferred.entries()){let n=this.normalizeInstanceIdentifier(e);try{let e=this.getOrInitializeService({instanceIdentifier:n});t.resolve(e)}catch(e){}}}}clearInstance(e=a){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){let e=Array.from(this.instances.values());await Promise.all([...e.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...e.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return null!=this.component}isInitialized(e=a){return this.instances.has(e)}getOptions(e=a){return this.instancesOptions.get(e)||{}}initialize(e={}){let{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);let i=this.getOrInitializeService({instanceIdentifier:n,options:t});for(let[e,t]of this.instancesDeferred.entries())n===this.normalizeInstanceIdentifier(e)&&t.resolve(i);return i}onInit(e,t){var n;let i=this.normalizeInstanceIdentifier(t),r=null!==(n=this.onInitCallbacks.get(i))&&void 0!==n?n:new Set;r.add(e),this.onInitCallbacks.set(i,r);let a=this.instances.get(i);return a&&e(a,i),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){let n=this.onInitCallbacks.get(t);if(n)for(let i of n)try{i(e,t)}catch(e){}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:e===a?void 0:e,options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch(e){}return n||null}normalizeInstanceIdentifier(e=a){return this.component?this.component.multipleInstances?e:a:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class s{constructor(e){this.name=e,this.providers=new Map}addComponent(e){let t=this.getProvider(e.name);if(t.isComponentSet())throw Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);let t=new o(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}},7123:function(e,t,n){"use strict";var i=n(2238),r=n(8463),a=n(4444),o=n(6531);let s="@firebase/installations",c="0.6.9",l=`w:${c}`,u="FIS_v2",d=new a.LL("installations","Installations",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."});function f(e){return e instanceof a.ZR&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function h({projectId:e}){return`https://firebaseinstallations.googleapis.com/v1/projects/${e}/installations`}function p(e){return{token:e.token,requestStatus:2,expiresIn:Number(e.expiresIn.replace("s","000")),creationTime:Date.now()}}async function g(e,t){let n=(await t.json()).error;return d.create("request-failed",{requestName:e,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function m({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}async function w(e){let t=await e();return t.status>=500&&t.status<600?e():t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function b({appConfig:e,heartbeatServiceProvider:t},{fid:n}){let i=h(e),r=m(e),a=t.getImmediate({optional:!0});if(a){let e=await a.getHeartbeatsHeader();e&&r.append("x-firebase-client",e)}let o={method:"POST",headers:r,body:JSON.stringify({fid:n,authVersion:u,appId:e.appId,sdkVersion:l})},s=await w(()=>fetch(i,o));if(s.ok){let e=await s.json();return{fid:e.fid||n,registrationStatus:2,refreshToken:e.refreshToken,authToken:p(e.authToken)}}throw await g("Create Installation",s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function y(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let v=/^[cdef][\w-]{21}$/;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let S=new Map;function _(e,t){let n=I(e);E(n,t),function(e,t){let n=(!T&&"BroadcastChannel"in self&&((T=new BroadcastChannel("[Firebase] FID Change")).onmessage=e=>{E(e.data.key,e.data.fid)}),T);n&&n.postMessage({key:e,fid:t}),0===S.size&&T&&(T.close(),T=null)}(n,t)}function E(e,t){let n=S.get(e);if(n)for(let e of n)e(t)}let T=null,D="firebase-installations-store",C=null;function A(){return C||(C=(0,o.X3)("firebase-installations-database",1,{upgrade:(e,t)=>{0===t&&e.createObjectStore(D)}})),C}async function k(e,t){let n=I(e),i=(await A()).transaction(D,"readwrite"),r=i.objectStore(D),a=await r.get(n);return await r.put(t,n),await i.done,a&&a.fid===t.fid||_(e,t.fid),t}async function O(e){let t=I(e),n=(await A()).transaction(D,"readwrite");await n.objectStore(D).delete(t),await n.done}async function L(e,t){let n=I(e),i=(await A()).transaction(D,"readwrite"),r=i.objectStore(D),a=await r.get(n),o=t(a);return void 0===o?await r.delete(n):await r.put(o,n),await i.done,o&&(!a||a.fid!==o.fid)&&_(e,o.fid),o}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function M(e){let t;let n=await L(e.appConfig,n=>{let i=function(e,t){if(0===t.registrationStatus){if(!navigator.onLine)return{installationEntry:t,registrationPromise:Promise.reject(d.create("app-offline"))};let n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},i=N(e,n);return{installationEntry:n,registrationPromise:i}}return 1===t.registrationStatus?{installationEntry:t,registrationPromise:j(e)}:{installationEntry:t}}(e,$(n||{fid:function(){try{let e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;let t=btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_").substr(0,22);return v.test(t)?t:""}catch(e){return""}}(),registrationStatus:0}));return t=i.registrationPromise,i.installationEntry});return""===n.fid?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}async function N(e,t){try{let n=await b(e,t);return k(e.appConfig,n)}catch(n){throw f(n)&&409===n.customData.serverCode?await O(e.appConfig):await k(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function j(e){let t=await P(e.appConfig);for(;1===t.registrationStatus;)await y(100),t=await P(e.appConfig);if(0===t.registrationStatus){let{installationEntry:t,registrationPromise:n}=await M(e);return n||t}return t}function P(e){return L(e,e=>{if(!e)throw d.create("installation-not-found");return $(e)})}function $(e){return 1===e.registrationStatus&&e.registrationTime+1e4<Date.now()?{fid:e.fid,registrationStatus:0}:e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function B({appConfig:e,heartbeatServiceProvider:t},n){let i=function(e,{fid:t}){return`${h(e)}/${t}/authTokens:generate`}(e,n),r=function(e,{refreshToken:t}){let n=m(e);return n.append("Authorization",`${u} ${t}`),n}(e,n),a=t.getImmediate({optional:!0});if(a){let e=await a.getHeartbeatsHeader();e&&r.append("x-firebase-client",e)}let o={method:"POST",headers:r,body:JSON.stringify({installation:{sdkVersion:l,appId:e.appId}})},s=await w(()=>fetch(i,o));if(s.ok)return p(await s.json());throw await g("Generate Auth Token",s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function F(e,t=!1){let n;let i=await L(e.appConfig,i=>{var r;if(!K(i))throw d.create("not-registered");let a=i.authToken;if(!t&&2===(r=a).requestStatus&&!function(e){let t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+36e5}(r))return i;if(1===a.requestStatus)return n=R(e,t),i;{if(!navigator.onLine)throw d.create("app-offline");let t=function(e){let t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}(i);return n=x(e,t),t}});return n?await n:i.authToken}async function R(e,t){let n=await H(e.appConfig);for(;1===n.authToken.requestStatus;)await y(100),n=await H(e.appConfig);let i=n.authToken;return 0===i.requestStatus?F(e,t):i}function H(e){return L(e,e=>{var t;if(!K(e))throw d.create("not-registered");return 1===(t=e.authToken).requestStatus&&t.requestTime+1e4<Date.now()?Object.assign(Object.assign({},e),{authToken:{requestStatus:0}}):e})}async function x(e,t){try{let n=await B(e,t),i=Object.assign(Object.assign({},t),{authToken:n});return await k(e.appConfig,i),n}catch(n){if(f(n)&&(401===n.customData.serverCode||404===n.customData.serverCode))await O(e.appConfig);else{let n=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await k(e.appConfig,n)}throw n}}function K(e){return void 0!==e&&2===e.registrationStatus}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function z(e){let{installationEntry:t,registrationPromise:n}=await M(e);return n?n.catch(console.error):F(e).catch(console.error),t.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function V(e,t=!1){return await W(e),(await F(e,t)).token}async function W(e){let{registrationPromise:t}=await M(e);t&&await t}function U(e){return d.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let q="installations";(0,i.Xd)(new r.wA(q,e=>{let t=e.getProvider("app").getImmediate(),n=/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e){if(!e||!e.options)throw U("App Configuration");if(!e.name)throw U("App Name");for(let t of["projectId","apiKey","appId"])if(!e.options[t])throw U(t);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}(t),r=(0,i.qX)(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},"PUBLIC")),(0,i.Xd)(new r.wA("installations-internal",e=>{let t=e.getProvider("app").getImmediate(),n=(0,i.qX)(t,q).getImmediate();return{getId:()=>z(n),getToken:e=>V(n,e)}},"PRIVATE")),(0,i.KN)(s,c),(0,i.KN)(s,c,"esm2017")},3333:function(e,t,n){"use strict";var i,r;n.d(t,{Yd:function(){return u}});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let a=[];(r=i||(i={}))[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT";let o={debug:i.DEBUG,verbose:i.VERBOSE,info:i.INFO,warn:i.WARN,error:i.ERROR,silent:i.SILENT},s=i.INFO,c={[i.DEBUG]:"log",[i.VERBOSE]:"log",[i.INFO]:"info",[i.WARN]:"warn",[i.ERROR]:"error"},l=(e,t,...n)=>{if(t<e.logLevel)return;let i=new Date().toISOString(),r=c[t];if(r)console[r](`[${i}]  ${e.name}:`,...n);else throw Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class u{constructor(e){this.name=e,this._logLevel=s,this._logHandler=l,this._userLogHandler=null,a.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in i))throw TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?o[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,i.DEBUG,...e),this._logHandler(this,i.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,i.VERBOSE,...e),this._logHandler(this,i.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,i.INFO,...e),this._logHandler(this,i.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,i.WARN,...e),this._logHandler(this,i.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,i.ERROR,...e),this._logHandler(this,i.ERROR,...e)}}},9261:function(e,t,n){"use strict";let i,r,a,o;n.d(t,{IH:function(){return j}});var s=n(2238),c=n(3333),l=n(4444),u=n(8463);n(7123);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let d="analytics",f="https://www.googletagmanager.com/gtag/js",h=new c.Yd("@firebase/analytics"),p=new l.LL("analytics","Analytics",{"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."});/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function g(e){if(!e.startsWith(f)){let t=p.create("invalid-gtag-resource",{gtagURL:e});return h.warn(t.message),""}return e}function m(e){return Promise.all(e.map(e=>e.catch(e=>e)))}async function w(e,t,n,i,r,a){let o=i[r];try{if(o)await t[o];else{let e=(await m(n)).find(e=>e.measurementId===r);e&&await t[e.appId]}}catch(e){h.error(e)}e("config",r,a)}async function b(e,t,n,i,r){try{let a=[];if(r&&r.send_to){let e=r.send_to;Array.isArray(e)||(e=[e]);let i=await m(n);for(let n of e){let e=i.find(e=>e.measurementId===n),r=e&&t[e.appId];if(r)a.push(r);else{a=[];break}}}0===a.length&&(a=Object.values(t)),await Promise.all(a),e("event",i,r||{})}catch(e){h.error(e)}}class y{constructor(e={},t=1e3){this.throttleMetadata=e,this.intervalMillis=t}getThrottleMetadata(e){return this.throttleMetadata[e]}setThrottleMetadata(e,t){this.throttleMetadata[e]=t}deleteThrottleMetadata(e){delete this.throttleMetadata[e]}}let v=new y;async function I(e){var t;let{appId:n,apiKey:i}=e,r={method:"GET",headers:new Headers({Accept:"application/json","x-goog-api-key":i})},a="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig".replace("{app-id}",n),o=await fetch(a,r);if(200!==o.status&&304!==o.status){let e="";try{let n=await o.json();(null===(t=n.error)||void 0===t?void 0:t.message)&&(e=n.error.message)}catch(e){}throw p.create("config-fetch-failed",{httpStatus:o.status,responseMessage:e})}return o.json()}async function S(e,t=v,n){let{appId:i,apiKey:r,measurementId:a}=e.options;if(!i)throw p.create("no-app-id");if(!r){if(a)return{measurementId:a,appId:i};throw p.create("no-api-key")}let o=t.getThrottleMetadata(i)||{backoffCount:0,throttleEndTimeMillis:Date.now()},s=new E;return setTimeout(async()=>{s.abort()},void 0!==n?n:6e4),_({appId:i,apiKey:r,measurementId:a},o,s,t)}async function _(e,{throttleEndTimeMillis:t,backoffCount:n},i,r=v){var a;let{appId:o,measurementId:s}=e;try{await new Promise((e,n)=>{let r=setTimeout(e,Math.max(t-Date.now(),0));i.addEventListener(()=>{clearTimeout(r),n(p.create("fetch-throttle",{throttleEndTimeMillis:t}))})})}catch(e){if(s)return h.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${null==e?void 0:e.message}]`),{appId:o,measurementId:s};throw e}try{let t=await I(e);return r.deleteThrottleMetadata(o),t}catch(u){if(!function(e){if(!(e instanceof l.ZR)||!e.customData)return!1;let t=Number(e.customData.httpStatus);return 429===t||500===t||503===t||504===t}(u)){if(r.deleteThrottleMetadata(o),s)return h.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${s} provided in the "measurementId" field in the local Firebase config. [${null==u?void 0:u.message}]`),{appId:o,measurementId:s};throw u}let t=503===Number(null===(a=null==u?void 0:u.customData)||void 0===a?void 0:a.httpStatus)?(0,l.$s)(n,r.intervalMillis,30):(0,l.$s)(n,r.intervalMillis),c={throttleEndTimeMillis:Date.now()+t,backoffCount:n+1};return r.setThrottleMetadata(o,c),h.debug(`Calling attemptFetch again in ${t} millis`),_(e,c,i,r)}}class E{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach(e=>e())}}async function T(e,t,n,i,r){if(r&&r.global){e("event",n,i);return}{let r=await t;e("event",n,Object.assign(Object.assign({},i),{send_to:r}))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function D(){if(!(0,l.hl)())return h.warn(p.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;try{await (0,l.eu)()}catch(e){return h.warn(p.create("indexeddb-unavailable",{errorInfo:null==e?void 0:e.toString()}).message),!1}return!0}async function C(e,t,n,a,o,s,c){var l;let u=S(e);u.then(t=>{n[t.measurementId]=t.appId,e.options.measurementId&&t.measurementId!==e.options.measurementId&&h.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${t.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(e=>h.error(e)),t.push(u);let d=D().then(e=>e?a.getId():void 0),[p,m]=await Promise.all([u,d]);!function(e){for(let t of Object.values(window.document.getElementsByTagName("script")))if(t.src&&t.src.includes(f)&&t.src.includes(e))return t;return null}(s)&&function(e,t){let n;let i=(window.trustedTypes&&(n=window.trustedTypes.createPolicy("firebase-js-sdk-policy",{createScriptURL:g})),n),r=document.createElement("script"),a=`${f}?l=${e}&id=${t}`;r.src=i?null==i?void 0:i.createScriptURL(a):a,r.async=!0,document.head.appendChild(r)}(s,p.measurementId),r&&(o("consent","default",r),r=void 0),o("js",new Date);let w=null!==(l=null==c?void 0:c.config)&&void 0!==l?l:{};return w.origin="firebase",w.update=!0,null!=m&&(w.firebase_id=m),o("config",p.measurementId,w),i&&(o("set",i),i=void 0),p.measurementId}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A{constructor(e){this.app=e}_delete(){return delete k[this.app.options.appId],Promise.resolve()}}let k={},O=[],L={},M="dataLayer",N=!1;function j(e=(0,s.Mq)()){e=(0,l.m9)(e);let t=(0,s.qX)(e,d);return t.isInitialized()?t.getImmediate():function(e,t={}){let n=(0,s.qX)(e,d);if(n.isInitialized()){let e=n.getImmediate();if((0,l.vZ)(t,n.getOptions()))return e;throw p.create("already-initialized")}return n.initialize({options:t})}(e)}let P="@firebase/analytics",$="0.10.8";(0,s.Xd)(new u.wA(d,(e,{options:t})=>(function(e,t,n){!function(){let e=[];if((0,l.ru)()&&e.push("This is a browser extension environment."),(0,l.zI)()||e.push("Cookies are not available."),e.length>0){let t=e.map((e,t)=>`(${t+1}) ${e}`).join(" "),n=p.create("invalid-analytics-context",{errorInfo:t});h.warn(n.message)}}();let i=e.options.appId;if(!i)throw p.create("no-app-id");if(!e.options.apiKey){if(e.options.measurementId)h.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw p.create("no-api-key")}if(null!=k[i])throw p.create("already-exists",{id:i});if(!N){var r,s;let e,t;e=[],Array.isArray(window[M])?e=window[M]:window[M]=e;let{wrappedGtag:n,gtagCore:i}=(r="gtag",t=function(...e){window[M].push(arguments)},window[r]&&"function"==typeof window[r]&&(t=window[r]),window[r]=(s=t,async function(e,...t){try{if("event"===e){let[e,n]=t;await b(s,k,O,e,n)}else if("config"===e){let[e,n]=t;await w(s,k,O,L,e,n)}else if("consent"===e){let[e,n]=t;s("consent",e,n)}else if("get"===e){let[e,n,i]=t;s("get",e,n,i)}else if("set"===e){let[e]=t;s("set",e)}else s(e,...t)}catch(e){h.error(e)}}),{gtagCore:t,wrappedGtag:window[r]});o=n,a=i,N=!0}return k[i]=C(e,O,L,t,a,M,n),new A(e)})(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),t),"PUBLIC")),(0,s.Xd)(new u.wA("analytics-internal",function(e){try{let t=e.getProvider(d).getImmediate();return{logEvent:(e,n,i)=>{var r;return r=t,void(r=(0,l.m9)(r),T(o,k[r.app.options.appId],e,n,i).catch(e=>h.error(e)))}}}catch(e){throw p.create("interop-component-reg-failed",{reason:e})}},"PRIVATE")),(0,s.KN)(P,$),(0,s.KN)(P,$,"esm2017")},3977:function(e,t,n){"use strict";n.d(t,{C6:function(){return i.C6},ZF:function(){return i.ZF}});var i=n(2238);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(0,i.KN)("firebase","10.14.1","app")},6517:function(e,t,n){"use strict";n.d(t,{KL:function(){return W},LP:function(){return U}}),n(7123);var i,r,a,o,s=n(8463),c=n(6531),l=n(4444),u=n(2238);let d="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",f="google.c.a.c_id";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function h(e){return btoa(String.fromCharCode(...new Uint8Array(e))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}(i=a||(a={}))[i.DATA_MESSAGE=1]="DATA_MESSAGE",i[i.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION",(r=o||(o={})).PUSH_RECEIVED="push-received",r.NOTIFICATION_CLICKED="notification-clicked";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let p="fcm_token_details_db",g="fcm_token_object_Store";async function m(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(e=>e.name).includes(p))return null;let t=null;return(await (0,c.X3)(p,5,{upgrade:async(n,i,r,a)=>{var o;if(i<2||!n.objectStoreNames.contains(g))return;let s=a.objectStore(g),c=await s.index("fcmSenderId").get(e);if(await s.clear(),c){if(2===i){if(!c.auth||!c.p256dh||!c.endpoint)return;t={token:c.fcmToken,createTime:null!==(o=c.createTime)&&void 0!==o?o:Date.now(),subscriptionOptions:{auth:c.auth,p256dh:c.p256dh,endpoint:c.endpoint,swScope:c.swScope,vapidKey:"string"==typeof c.vapidKey?c.vapidKey:h(c.vapidKey)}}}else 3===i?t={token:c.fcmToken,createTime:c.createTime,subscriptionOptions:{auth:h(c.auth),p256dh:h(c.p256dh),endpoint:c.endpoint,swScope:c.swScope,vapidKey:h(c.vapidKey)}}:4===i&&(t={token:c.fcmToken,createTime:c.createTime,subscriptionOptions:{auth:h(c.auth),p256dh:h(c.p256dh),endpoint:c.endpoint,swScope:c.swScope,vapidKey:h(c.vapidKey)}})}}})).close(),await (0,c.Lj)(p),await (0,c.Lj)("fcm_vapid_details_db"),await (0,c.Lj)("undefined"),!function(e){if(!e||!e.subscriptionOptions)return!1;let{subscriptionOptions:t}=e;return"number"==typeof e.createTime&&e.createTime>0&&"string"==typeof e.token&&e.token.length>0&&"string"==typeof t.auth&&t.auth.length>0&&"string"==typeof t.p256dh&&t.p256dh.length>0&&"string"==typeof t.endpoint&&t.endpoint.length>0&&"string"==typeof t.swScope&&t.swScope.length>0&&"string"==typeof t.vapidKey&&t.vapidKey.length>0}(t)?null:t}let w="firebase-messaging-store",b=null;function y(){return b||(b=(0,c.X3)("firebase-messaging-database",1,{upgrade:(e,t)=>{0===t&&e.createObjectStore(w)}})),b}async function v(e){let t=function({appConfig:e}){return e.appId}(e),n=await y(),i=await n.transaction(w).objectStore(w).get(t);if(i)return i;{let t=await m(e.appConfig.senderId);if(t)return await I(e,t),t}}async function I(e,t){let n=function({appConfig:e}){return e.appId}(e),i=(await y()).transaction(w,"readwrite");return await i.objectStore(w).put(t,n),await i.done,t}let S=new l.LL("messaging","Messaging",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."});/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _(e,t){let n;let i={method:"POST",headers:await C(e),body:JSON.stringify(A(t))};try{let t=await fetch(D(e.appConfig),i);n=await t.json()}catch(e){throw S.create("token-subscribe-failed",{errorInfo:null==e?void 0:e.toString()})}if(n.error){let e=n.error.message;throw S.create("token-subscribe-failed",{errorInfo:e})}if(!n.token)throw S.create("token-subscribe-no-token");return n.token}async function E(e,t){let n;let i={method:"PATCH",headers:await C(e),body:JSON.stringify(A(t.subscriptionOptions))};try{let r=await fetch(`${D(e.appConfig)}/${t.token}`,i);n=await r.json()}catch(e){throw S.create("token-update-failed",{errorInfo:null==e?void 0:e.toString()})}if(n.error){let e=n.error.message;throw S.create("token-update-failed",{errorInfo:e})}if(!n.token)throw S.create("token-update-no-token");return n.token}async function T(e,t){let n=await C(e);try{let i=await fetch(`${D(e.appConfig)}/${t}`,{method:"DELETE",headers:n}),r=await i.json();if(r.error){let e=r.error.message;throw S.create("token-unsubscribe-failed",{errorInfo:e})}}catch(e){throw S.create("token-unsubscribe-failed",{errorInfo:null==e?void 0:e.toString()})}}function D({projectId:e}){return`https://fcmregistrations.googleapis.com/v1/projects/${e}/registrations`}async function C({appConfig:e,installations:t}){let n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function A({p256dh:e,auth:t,endpoint:n,vapidKey:i}){let r={web:{endpoint:n,auth:t,p256dh:e}};return i!==d&&(r.web.applicationPubKey=i),r}async function k(e){let t=await M(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:h(t.getKey("auth")),p256dh:h(t.getKey("p256dh"))},i=await v(e.firebaseDependencies);if(!i)return L(e.firebaseDependencies,n);if(function(e,t){let n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,r=t.auth===e.auth,a=t.p256dh===e.p256dh;return n&&i&&r&&a}(i.subscriptionOptions,n))return Date.now()>=i.createTime+6048e5?O(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await T(e.firebaseDependencies,i.token)}catch(e){console.warn(e)}return L(e.firebaseDependencies,n)}async function O(e,t){try{let n=await E(e.firebaseDependencies,t),i=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await I(e.firebaseDependencies,i),n}catch(e){throw e}}async function L(e,t){let n={token:await _(e,t),createTime:Date.now(),subscriptionOptions:t};return await I(e,n),n.token}async function M(e,t){return await e.pushManager.getSubscription()||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:function(e){let t="=".repeat((4-e.length%4)%4),n=atob((e+t).replace(/\-/g,"+").replace(/_/g,"/")),i=new Uint8Array(n.length);for(let e=0;e<n.length;++e)i[e]=n.charCodeAt(e);return i}(t)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function N(e){let t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return function(e,t){if(!t.notification)return;e.notification={};let n=t.notification.title;n&&(e.notification.title=n);let i=t.notification.body;i&&(e.notification.body=i);let r=t.notification.image;r&&(e.notification.image=r);let a=t.notification.icon;a&&(e.notification.icon=a)}(t,e),e.data&&(t.data=e.data),function(e,t){var n,i,r,a,o;if(!t.fcmOptions&&!(null===(n=t.notification)||void 0===n?void 0:n.click_action))return;e.fcmOptions={};let s=null!==(r=null===(i=t.fcmOptions)||void 0===i?void 0:i.link)&&void 0!==r?r:null===(a=t.notification)||void 0===a?void 0:a.click_action;s&&(e.fcmOptions.link=s);let c=null===(o=t.fcmOptions)||void 0===o?void 0:o.analytics_label;c&&(e.fcmOptions.analyticsLabel=c)}(t,e),t}function j(e){return S.create("missing-app-config-values",{valueName:e})}!/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e,t){let n=[];for(let i=0;i<e.length;i++)n.push(e.charAt(i)),i<t.length&&n.push(t.charAt(i));n.join("")}("AzSCbw63g1R0nCw85jG8","Iaya3yLKwmgvh7cF0q4");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;let i=/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e){if(!e||!e.options)throw j("App Configuration Object");if(!e.name)throw j("App Name");let{options:t}=e;for(let e of["projectId","apiKey","appId","messagingSenderId"])if(!t[e])throw j(e);return{appName:e.name,projectId:t.projectId,apiKey:t.apiKey,appId:t.appId,senderId:t.messagingSenderId}}(e);this.firebaseDependencies={app:e,appConfig:i,installations:t,analyticsProvider:n}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $(e){try{e.swRegistration=await navigator.serviceWorker.register("/firebase-messaging-sw.js",{scope:"/firebase-cloud-messaging-push-scope"}),e.swRegistration.update().catch(()=>{})}catch(e){throw S.create("failed-service-worker-registration",{browserErrorMessage:null==e?void 0:e.message})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function B(e,t){if(t||e.swRegistration||await $(e),t||!e.swRegistration){if(!(t instanceof ServiceWorkerRegistration))throw S.create("invalid-sw-registration");e.swRegistration=t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function F(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=d)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function R(e,t){if(!navigator)throw S.create("only-available-in-window");if("default"===Notification.permission&&await Notification.requestPermission(),"granted"!==Notification.permission)throw S.create("permission-blocked");return await F(e,null==t?void 0:t.vapidKey),await B(e,null==t?void 0:t.serviceWorkerRegistration),k(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function H(e,t,n){let i=function(e){switch(e){case o.NOTIFICATION_CLICKED:return"notification_open";case o.PUSH_RECEIVED:return"notification_foreground";default:throw Error()}}(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(i,{message_id:n[f],message_name:n["google.c.a.c_l"],message_time:n["google.c.a.ts"],message_device_time:Math.floor(Date.now()/1e3)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function x(e,t){let n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===o.PUSH_RECEIVED&&("function"==typeof e.onMessageHandler?e.onMessageHandler(N(n)):e.onMessageHandler.next(N(n)));let i=n.data;"object"==typeof i&&i&&f in i&&"1"===i["google.c.a.e"]&&await H(e,n.messageType,i)}let K="@firebase/messaging",z="0.12.12";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function V(){try{await (0,l.eu)()}catch(e){return!1}return"undefined"!=typeof window&&(0,l.hl)()&&(0,l.zI)()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function W(e=(0,u.Mq)()){return V().then(e=>{if(!e)throw S.create("unsupported-browser")},e=>{throw S.create("indexed-db-unsupported")}),(0,u.qX)((0,l.m9)(e),"messaging").getImmediate()}async function U(e,t){return R(e=(0,l.m9)(e),t)}(0,u.Xd)(new s.wA("messaging",e=>{let t=new P(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",e=>x(t,e)),t},"PUBLIC")),(0,u.Xd)(new s.wA("messaging-internal",e=>{let t=e.getProvider("messaging").getImmediate();return{getToken:e=>R(t,e)}},"PRIVATE")),(0,u.KN)(K,z),(0,u.KN)(K,z,"esm2017")},6531:function(e,t,n){"use strict";var i;let r,a;n.d(t,{Lj:function(){return m},X3:function(){return g}});let o=(e,t)=>t.some(t=>e instanceof t),s=new WeakMap,c=new WeakMap,l=new WeakMap,u=new WeakMap,d=new WeakMap,f={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return c.get(e);if("objectStoreNames"===t)return e.objectStoreNames||l.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return h(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function h(e){var t;if(e instanceof IDBRequest)return function(e){let t=new Promise((t,n)=>{let i=()=>{e.removeEventListener("success",r),e.removeEventListener("error",a)},r=()=>{t(h(e.result)),i()},a=()=>{n(e.error),i()};e.addEventListener("success",r),e.addEventListener("error",a)});return t.then(t=>{t instanceof IDBCursor&&s.set(t,e)}).catch(()=>{}),d.set(t,e),t}(e);if(u.has(e))return u.get(e);let n="function"==typeof(t=e)?t!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(a||(a=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(t)?function(...e){return t.apply(p(this),e),h(s.get(this))}:function(...e){return h(t.apply(p(this),e))}:function(e,...n){let i=t.call(p(this),e,...n);return l.set(i,e.sort?e.sort():[e]),h(i)}:(t instanceof IDBTransaction&&function(e){if(c.has(e))return;let t=new Promise((t,n)=>{let i=()=>{e.removeEventListener("complete",r),e.removeEventListener("error",a),e.removeEventListener("abort",a)},r=()=>{t(),i()},a=()=>{n(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",r),e.addEventListener("error",a),e.addEventListener("abort",a)});c.set(e,t)}(t),o(t,r||(r=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])))?new Proxy(t,f):t;return n!==e&&(u.set(e,n),d.set(n,e)),n}let p=e=>d.get(e);function g(e,t,{blocked:n,upgrade:i,blocking:r,terminated:a}={}){let o=indexedDB.open(e,t),s=h(o);return i&&o.addEventListener("upgradeneeded",e=>{i(h(o.result),e.oldVersion,e.newVersion,h(o.transaction),e)}),n&&o.addEventListener("blocked",e=>n(e.oldVersion,e.newVersion,e)),s.then(e=>{a&&e.addEventListener("close",()=>a()),r&&e.addEventListener("versionchange",e=>r(e.oldVersion,e.newVersion,e))}).catch(()=>{}),s}function m(e,{blocked:t}={}){let n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",e=>t(e.oldVersion,e)),h(n).then(()=>void 0)}let w=["get","getKey","getAll","getAllKeys","count"],b=["put","add","delete","clear"],y=new Map;function v(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&"string"==typeof t))return;if(y.get(t))return y.get(t);let n=t.replace(/FromIndex$/,""),i=t!==n,r=b.includes(n);if(!(n in(i?IDBIndex:IDBObjectStore).prototype)||!(r||w.includes(n)))return;let a=async function(e,...t){let a=this.transaction(e,r?"readwrite":"readonly"),o=a.store;return i&&(o=o.index(t.shift())),(await Promise.all([o[n](...t),r&&a.done]))[0]};return y.set(t,a),a}f={...i=f,get:(e,t,n)=>v(e,t)||i.get(e,t,n),has:(e,t)=>!!v(e,t)||i.has(e,t)}}}]);