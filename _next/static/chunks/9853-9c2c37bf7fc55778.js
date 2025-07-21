(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9853],{8745:function(e,t,n){"use strict";n.d(t,{$s:function(){return T},BH:function(){return m},L:function(){return l},LL:function(){return k},ZR:function(){return _},aH:function(){return g},eu:function(){return w},hl:function(){return b},m9:function(){return S},ru:function(){return y},vZ:function(){return function e(t,n){if(t===n)return!0;let i=Object.keys(t),r=Object.keys(n);for(let s of i){if(!r.includes(s))return!1;let i=t[s],o=n[s];if(I(i)&&I(o)){if(!e(i,o))return!1}else if(i!==o)return!1}for(let e of r)if(!i.includes(e))return!1;return!0}},zI:function(){return v}});var i=n(5566);/**
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
 */let r=function(e){let t=[],n=0;for(let i=0;i<e.length;i++){let r=e.charCodeAt(i);r<128?t[n++]=r:(r<2048?t[n++]=r>>6|192:((64512&r)==55296&&i+1<e.length&&(64512&e.charCodeAt(i+1))==56320?(r=65536+((1023&r)<<10)+(1023&e.charCodeAt(++i)),t[n++]=r>>18|240,t[n++]=r>>12&63|128):t[n++]=r>>12|224,t[n++]=r>>6&63|128),t[n++]=63&r|128)}return t},s=function(e){let t=[],n=0,i=0;for(;n<e.length;){let r=e[n++];if(r<128)t[i++]=String.fromCharCode(r);else if(r>191&&r<224){let s=e[n++];t[i++]=String.fromCharCode((31&r)<<6|63&s)}else if(r>239&&r<365){let s=((7&r)<<18|(63&e[n++])<<12|(63&e[n++])<<6|63&e[n++])-65536;t[i++]=String.fromCharCode(55296+(s>>10)),t[i++]=String.fromCharCode(56320+(1023&s))}else{let s=e[n++],o=e[n++];t[i++]=String.fromCharCode((15&r)<<12|(63&s)<<6|63&o)}}return t.join("")},o={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();let n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let t=0;t<e.length;t+=3){let r=e[t],s=t+1<e.length,o=s?e[t+1]:0,a=t+2<e.length,c=a?e[t+2]:0,l=r>>2,h=(3&r)<<4|o>>4,u=(15&o)<<2|c>>6,d=63&c;a||(d=64,s||(u=64)),i.push(n[l],n[h],n[u],n[d])}return i.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(r(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):s(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();let n=t?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let t=0;t<e.length;){let r=n[e.charAt(t++)],s=t<e.length?n[e.charAt(t)]:0,o=++t<e.length?n[e.charAt(t)]:64,c=++t<e.length?n[e.charAt(t)]:64;if(++t,null==r||null==s||null==o||null==c)throw new a;let l=r<<2|s>>4;if(i.push(l),64!==o){let e=s<<4&240|o>>2;if(i.push(e),64!==c){let e=o<<6&192|c;i.push(e)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class a extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}let c=function(e){let t=r(e);return o.encodeByteArray(t,!0)},l=function(e){return c(e).replace(/\./g,"")},h=function(e){try{return o.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null},u=()=>/**
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
 */(function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if(void 0!==n.g)return n.g;throw Error("Unable to locate global object.")})().__FIREBASE_DEFAULTS__,d=()=>{if(void 0===i||void 0===i.env)return;let e=i.env.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},p=()=>{let e;if("undefined"==typeof document)return;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}let t=e&&h(e[1]);return t&&JSON.parse(t)},f=()=>{try{return u()||d()||p()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},g=()=>{var e;return null===(e=f())||void 0===e?void 0:e.config};/**
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
 */class m{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),"function"==typeof e&&(this.promise.catch(()=>{}),1===e.length?e(t):e(t,n))}}}function y(){let e="object"==typeof chrome?chrome.runtime:"object"==typeof browser?browser.runtime:void 0;return"object"==typeof e&&void 0!==e.id}function b(){try{return"object"==typeof indexedDB}catch(e){return!1}}function w(){return new Promise((e,t)=>{try{let n=!0,i="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(i);r.onsuccess=()=>{r.result.close(),n||self.indexedDB.deleteDatabase(i),e(!0)},r.onupgradeneeded=()=>{n=!1},r.onerror=()=>{var e;t((null===(e=r.error)||void 0===e?void 0:e.message)||"")}}catch(e){t(e)}})}function v(){return"undefined"!=typeof navigator&&!!navigator.cookieEnabled}class _ extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name="FirebaseError",Object.setPrototypeOf(this,_.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,k.prototype.create)}}class k{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){let n=t[0]||{},i=`${this.service}/${e}`,r=this.errors[e],s=r?r.replace(E,(e,t)=>{let i=n[t];return null!=i?String(i):`<${t}?>`}):"Error",o=`${this.serviceName}: ${s} (${i}).`;return new _(i,o,n)}}let E=/\{\$([^}]+)}/g;function I(e){return null!==e&&"object"==typeof e}function T(e,t=1e3,n=2){let i=t*Math.pow(n,e);return Math.min(144e5,i+Math.round(.5*i*(Math.random()-.5)*2))}/**
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
 */function S(e){return e&&e._delegate?e._delegate:e}},5566:function(e){var t,n,i,r=e.exports={};function s(){throw Error("setTimeout has not been defined")}function o(){throw Error("clearTimeout has not been defined")}function a(e){if(t===setTimeout)return setTimeout(e,0);if((t===s||!t)&&setTimeout)return t=setTimeout,setTimeout(e,0);try{return t(e,0)}catch(n){try{return t.call(null,e,0)}catch(n){return t.call(this,e,0)}}}!function(){try{t="function"==typeof setTimeout?setTimeout:s}catch(e){t=s}try{n="function"==typeof clearTimeout?clearTimeout:o}catch(e){n=o}}();var c=[],l=!1,h=-1;function u(){l&&i&&(l=!1,i.length?c=i.concat(c):h=-1,c.length&&d())}function d(){if(!l){var e=a(u);l=!0;for(var t=c.length;t;){for(i=c,c=[];++h<t;)i&&i[h].run();h=-1,t=c.length}i=null,l=!1,function(e){if(n===clearTimeout)return clearTimeout(e);if((n===o||!n)&&clearTimeout)return n=clearTimeout,clearTimeout(e);try{n(e)}catch(t){try{return n.call(null,e)}catch(t){return n.call(this,e)}}}(e)}}function p(e,t){this.fun=e,this.array=t}function f(){}r.nextTick=function(e){var t=Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];c.push(new p(e,t)),1!==c.length||l||a(d)},p.prototype.run=function(){this.fun.apply(null,this.array)},r.title="browser",r.browser=!0,r.env={},r.argv=[],r.version="",r.versions={},r.on=f,r.addListener=f,r.once=f,r.off=f,r.removeListener=f,r.removeAllListeners=f,r.emit=f,r.prependListener=f,r.prependOnceListener=f,r.listeners=function(e){return[]},r.binding=function(e){throw Error("process.binding is not supported")},r.cwd=function(){return"/"},r.chdir=function(e){throw Error("process.chdir is not supported")},r.umask=function(){return 0}},206:function(e,t,n){"use strict";n.d(t,{C6:function(){return E},KN:function(){return I},Mq:function(){return k},Xd:function(){return y},ZF:function(){return _},qX:function(){return b}});var i=n(5538),r=n(6914),s=n(8745),o=n(8542);/**
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
 */class a{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(e=>{if(!function(e){let t=e.getComponent();return(null==t?void 0:t.type)==="VERSION"}(e))return null;{let t=e.getImmediate();return`${t.library}/${t.version}`}}).filter(e=>e).join(" ")}}let c="@firebase/app",l="0.10.13",h=new r.Yd("@firebase/app"),u="[DEFAULT]",d={[c]:"fire-core","@firebase/app-compat":"fire-core-compat","@firebase/analytics":"fire-analytics","@firebase/analytics-compat":"fire-analytics-compat","@firebase/app-check":"fire-app-check","@firebase/app-check-compat":"fire-app-check-compat","@firebase/auth":"fire-auth","@firebase/auth-compat":"fire-auth-compat","@firebase/database":"fire-rtdb","@firebase/data-connect":"fire-data-connect","@firebase/database-compat":"fire-rtdb-compat","@firebase/functions":"fire-fn","@firebase/functions-compat":"fire-fn-compat","@firebase/installations":"fire-iid","@firebase/installations-compat":"fire-iid-compat","@firebase/messaging":"fire-fcm","@firebase/messaging-compat":"fire-fcm-compat","@firebase/performance":"fire-perf","@firebase/performance-compat":"fire-perf-compat","@firebase/remote-config":"fire-rc","@firebase/remote-config-compat":"fire-rc-compat","@firebase/storage":"fire-gcs","@firebase/storage-compat":"fire-gcs-compat","@firebase/firestore":"fire-fst","@firebase/firestore-compat":"fire-fst-compat","@firebase/vertexai-preview":"fire-vertex","fire-js":"fire-js",firebase:"fire-js-all"},p=new Map,f=new Map,g=new Map;function m(e,t){try{e.container.addComponent(t)}catch(n){h.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function y(e){let t=e.name;if(g.has(t))return h.debug(`There were multiple attempts to register component ${t}.`),!1;for(let n of(g.set(t,e),p.values()))m(n,e);for(let t of f.values())m(t,e);return!0}function b(e,t){let n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}let w=new s.LL("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."});/**
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
 */class v{constructor(e,t,n){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new i.wA("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw w.create("app-deleted",{appName:this._name})}}function _(e,t={}){let n=e;"object"!=typeof t&&(t={name:t});let r=Object.assign({name:u,automaticDataCollectionEnabled:!1},t),o=r.name;if("string"!=typeof o||!o)throw w.create("bad-app-name",{appName:String(o)});if(n||(n=(0,s.aH)()),!n)throw w.create("no-options");let a=p.get(o);if(a){if((0,s.vZ)(n,a.options)&&(0,s.vZ)(r,a.config))return a;throw w.create("duplicate-app",{appName:o})}let c=new i.H0(o);for(let e of g.values())c.addComponent(e);let l=new v(n,r,c);return p.set(o,l),l}function k(e=u){let t=p.get(e);if(!t&&e===u&&(0,s.aH)())return _();if(!t)throw w.create("no-app",{appName:e});return t}function E(){return Array.from(p.values())}function I(e,t,n){var r;let s=null!==(r=d[e])&&void 0!==r?r:e;n&&(s+=`-${n}`);let o=s.match(/\s|\//),a=t.match(/\s|\//);if(o||a){let e=[`Unable to register library "${s}" with version "${t}":`];o&&e.push(`library name "${s}" contains illegal characters (whitespace or "/")`),o&&a&&e.push("and"),a&&e.push(`version name "${t}" contains illegal characters (whitespace or "/")`),h.warn(e.join(" "));return}y(new i.wA(`${s}-version`,()=>({library:s,version:t}),"VERSION"))}let T="firebase-heartbeat-store",S=null;function A(){return S||(S=(0,o.X3)("firebase-heartbeat-database",1,{upgrade:(e,t)=>{if(0===t)try{e.createObjectStore(T)}catch(e){console.warn(e)}}}).catch(e=>{throw w.create("idb-open",{originalErrorMessage:e.message})})),S}async function C(e){try{let t=(await A()).transaction(T),n=await t.objectStore(T).get(D(e));return await t.done,n}catch(e){if(e instanceof s.ZR)h.warn(e.message);else{let t=w.create("idb-get",{originalErrorMessage:null==e?void 0:e.message});h.warn(t.message)}}}async function O(e,t){try{let n=(await A()).transaction(T,"readwrite"),i=n.objectStore(T);await i.put(t,D(e)),await n.done}catch(e){if(e instanceof s.ZR)h.warn(e.message);else{let t=w.create("idb-set",{originalErrorMessage:null==e?void 0:e.message});h.warn(t.message)}}}function D(e){return`${e.name}!${e.options.appId}`}class L{constructor(e){this.container=e,this._heartbeatsCache=null;let t=this.container.getProvider("app").getImmediate();this._storage=new R(t),this._heartbeatsCachePromise=this._storage.read().then(e=>(this._heartbeatsCache=e,e))}async triggerHeartbeat(){var e,t;try{let n=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),i=B();if((null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,(null===(t=this._heartbeatsCache)||void 0===t?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===i||this._heartbeatsCache.heartbeats.some(e=>e.date===i))return;return this._heartbeatsCache.heartbeats.push({date:i,agent:n}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(e=>{let t=new Date(e.date).valueOf();return Date.now()-t<=2592e6}),this._storage.overwrite(this._heartbeatsCache)}catch(e){h.warn(e)}}async getHeartbeatsHeader(){var e;try{if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,(null===(e=this._heartbeatsCache)||void 0===e?void 0:e.heartbeats)==null||0===this._heartbeatsCache.heartbeats.length)return"";let t=B(),{heartbeatsToSend:n,unsentEntries:i}=function(e,t=1024){let n=[],i=e.slice();for(let r of e){let e=n.find(e=>e.agent===r.agent);if(e){if(e.dates.push(r.date),N(n)>t){e.dates.pop();break}}else if(n.push({agent:r.agent,dates:[r.date]}),N(n)>t){n.pop();break}i=i.slice(1)}return{heartbeatsToSend:n,unsentEntries:i}}(this._heartbeatsCache.heartbeats),r=(0,s.L)(JSON.stringify({version:2,heartbeats:n}));return this._heartbeatsCache.lastSentHeartbeatDate=t,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(e){return h.warn(e),""}}}function B(){return new Date().toISOString().substring(0,10)}class R{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!(0,s.hl)()&&(0,s.eu)().then(()=>!0).catch(()=>!1)}async read(){if(!await this._canUseIndexedDBPromise)return{heartbeats:[]};{let e=await C(this.app);return(null==e?void 0:e.heartbeats)?e:{heartbeats:[]}}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){let n=await this.read();return O(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){let n=await this.read();return O(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}}}function N(e){return(0,s.L)(JSON.stringify({version:2,heartbeats:e})).length}y(new i.wA("platform-logger",e=>new a(e),"PRIVATE")),y(new i.wA("heartbeat",e=>new L(e),"PRIVATE")),I(c,l,""),I(c,l,"esm2017"),I("fire-js","")},5538:function(e,t,n){"use strict";n.d(t,{H0:function(){return a},wA:function(){return r}});var i=n(8745);class r{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
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
 */let s="[DEFAULT]";/**
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
 */class o{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){let t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){let e=new i.BH;if(this.instancesDeferred.set(t,e),this.isInitialized(t)||this.shouldAutoInitialize())try{let n=this.getOrInitializeService({instanceIdentifier:t});n&&e.resolve(n)}catch(e){}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;let n=this.normalizeInstanceIdentifier(null==e?void 0:e.identifier),i=null!==(t=null==e?void 0:e.optional)&&void 0!==t&&t;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(e){if(i)return null;throw e}else{if(i)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if("EAGER"===e.instantiationMode)try{this.getOrInitializeService({instanceIdentifier:s})}catch(e){}for(let[e,t]of this.instancesDeferred.entries()){let n=this.normalizeInstanceIdentifier(e);try{let e=this.getOrInitializeService({instanceIdentifier:n});t.resolve(e)}catch(e){}}}}clearInstance(e=s){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){let e=Array.from(this.instances.values());await Promise.all([...e.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...e.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return null!=this.component}isInitialized(e=s){return this.instances.has(e)}getOptions(e=s){return this.instancesOptions.get(e)||{}}initialize(e={}){let{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);let i=this.getOrInitializeService({instanceIdentifier:n,options:t});for(let[e,t]of this.instancesDeferred.entries())n===this.normalizeInstanceIdentifier(e)&&t.resolve(i);return i}onInit(e,t){var n;let i=this.normalizeInstanceIdentifier(t),r=null!==(n=this.onInitCallbacks.get(i))&&void 0!==n?n:new Set;r.add(e),this.onInitCallbacks.set(i,r);let s=this.instances.get(i);return s&&e(s,i),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){let n=this.onInitCallbacks.get(t);if(n)for(let i of n)try{i(e,t)}catch(e){}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:e===s?void 0:e,options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch(e){}return n||null}normalizeInstanceIdentifier(e=s){return this.component?this.component.multipleInstances?e:s:e}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}/**
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
 */class a{constructor(e){this.name=e,this.providers=new Map}addComponent(e){let t=this.getProvider(e.name);if(t.isComponentSet())throw Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);let t=new o(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}},2334:function(e,t,n){"use strict";var i=n(206),r=n(5538),s=n(8745),o=n(8542);let a="@firebase/installations",c="0.6.9",l=`w:${c}`,h="FIS_v2",u=new s.LL("installations","Installations",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."});function d(e){return e instanceof s.ZR&&e.code.includes("request-failed")}/**
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
 */function p({projectId:e}){return`https://firebaseinstallations.googleapis.com/v1/projects/${e}/installations`}function f(e){return{token:e.token,requestStatus:2,expiresIn:Number(e.expiresIn.replace("s","000")),creationTime:Date.now()}}async function g(e,t){let n=(await t.json()).error;return u.create("request-failed",{requestName:e,serverCode:n.code,serverMessage:n.message,serverStatus:n.status})}function m({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}async function y(e){let t=await e();return t.status>=500&&t.status<600?e():t}/**
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
 */async function b({appConfig:e,heartbeatServiceProvider:t},{fid:n}){let i=p(e),r=m(e),s=t.getImmediate({optional:!0});if(s){let e=await s.getHeartbeatsHeader();e&&r.append("x-firebase-client",e)}let o={method:"POST",headers:r,body:JSON.stringify({fid:n,authVersion:h,appId:e.appId,sdkVersion:l})},a=await y(()=>fetch(i,o));if(a.ok){let e=await a.json();return{fid:e.fid||n,registrationStatus:2,refreshToken:e.refreshToken,authToken:f(e.authToken)}}throw await g("Create Installation",a)}/**
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
 */function w(e){return new Promise(t=>{setTimeout(t,e)})}/**
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
 */function _(e){return`${e.appName}!${e.appId}`}/**
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
 */let k=new Map;function E(e,t){let n=_(e);I(n,t),function(e,t){let n=(!T&&"BroadcastChannel"in self&&((T=new BroadcastChannel("[Firebase] FID Change")).onmessage=e=>{I(e.data.key,e.data.fid)}),T);n&&n.postMessage({key:e,fid:t}),0===k.size&&T&&(T.close(),T=null)}(n,t)}function I(e,t){let n=k.get(e);if(n)for(let e of n)e(t)}let T=null,S="firebase-installations-store",A=null;function C(){return A||(A=(0,o.X3)("firebase-installations-database",1,{upgrade:(e,t)=>{0===t&&e.createObjectStore(S)}})),A}async function O(e,t){let n=_(e),i=(await C()).transaction(S,"readwrite"),r=i.objectStore(S),s=await r.get(n);return await r.put(t,n),await i.done,s&&s.fid===t.fid||E(e,t.fid),t}async function D(e){let t=_(e),n=(await C()).transaction(S,"readwrite");await n.objectStore(S).delete(t),await n.done}async function L(e,t){let n=_(e),i=(await C()).transaction(S,"readwrite"),r=i.objectStore(S),s=await r.get(n),o=t(s);return void 0===o?await r.delete(n):await r.put(o,n),await i.done,o&&(!s||s.fid!==o.fid)&&E(e,o.fid),o}/**
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
 */async function B(e){let t;let n=await L(e.appConfig,n=>{let i=function(e,t){if(0===t.registrationStatus){if(!navigator.onLine)return{installationEntry:t,registrationPromise:Promise.reject(u.create("app-offline"))};let n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},i=R(e,n);return{installationEntry:n,registrationPromise:i}}return 1===t.registrationStatus?{installationEntry:t,registrationPromise:N(e)}:{installationEntry:t}}(e,P(n||{fid:function(){try{let e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;let t=btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_").substr(0,22);return v.test(t)?t:""}catch(e){return""}}(),registrationStatus:0}));return t=i.registrationPromise,i.installationEntry});return""===n.fid?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}async function R(e,t){try{let n=await b(e,t);return O(e.appConfig,n)}catch(n){throw d(n)&&409===n.customData.serverCode?await D(e.appConfig):await O(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function N(e){let t=await x(e.appConfig);for(;1===t.registrationStatus;)await w(100),t=await x(e.appConfig);if(0===t.registrationStatus){let{installationEntry:t,registrationPromise:n}=await B(e);return n||t}return t}function x(e){return L(e,e=>{if(!e)throw u.create("installation-not-found");return P(e)})}function P(e){return 1===e.registrationStatus&&e.registrationTime+1e4<Date.now()?{fid:e.fid,registrationStatus:0}:e}/**
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
 */async function j({appConfig:e,heartbeatServiceProvider:t},n){let i=function(e,{fid:t}){return`${p(e)}/${t}/authTokens:generate`}(e,n),r=function(e,{refreshToken:t}){let n=m(e);return n.append("Authorization",`${h} ${t}`),n}(e,n),s=t.getImmediate({optional:!0});if(s){let e=await s.getHeartbeatsHeader();e&&r.append("x-firebase-client",e)}let o={method:"POST",headers:r,body:JSON.stringify({installation:{sdkVersion:l,appId:e.appId}})},a=await y(()=>fetch(i,o));if(a.ok)return f(await a.json());throw await g("Generate Auth Token",a)}/**
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
 */async function M(e,t=!1){let n;let i=await L(e.appConfig,i=>{var r;if(!H(i))throw u.create("not-registered");let s=i.authToken;if(!t&&2===(r=s).requestStatus&&!function(e){let t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+36e5}(r))return i;if(1===s.requestStatus)return n=F(e,t),i;{if(!navigator.onLine)throw u.create("app-offline");let t=function(e){let t={requestStatus:1,requestTime:Date.now()};return Object.assign(Object.assign({},e),{authToken:t})}(i);return n=q(e,t),t}});return n?await n:i.authToken}async function F(e,t){let n=await $(e.appConfig);for(;1===n.authToken.requestStatus;)await w(100),n=await $(e.appConfig);let i=n.authToken;return 0===i.requestStatus?M(e,t):i}function $(e){return L(e,e=>{var t;if(!H(e))throw u.create("not-registered");return 1===(t=e.authToken).requestStatus&&t.requestTime+1e4<Date.now()?Object.assign(Object.assign({},e),{authToken:{requestStatus:0}}):e})}async function q(e,t){try{let n=await j(e,t),i=Object.assign(Object.assign({},t),{authToken:n});return await O(e.appConfig,i),n}catch(n){if(d(n)&&(401===n.customData.serverCode||404===n.customData.serverCode))await D(e.appConfig);else{let n=Object.assign(Object.assign({},t),{authToken:{requestStatus:0}});await O(e.appConfig,n)}throw n}}function H(e){return void 0!==e&&2===e.registrationStatus}/**
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
 */async function U(e){let{installationEntry:t,registrationPromise:n}=await B(e);return n?n.catch(console.error):M(e).catch(console.error),t.fid}/**
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
 */async function V(e,t=!1){return await K(e),(await M(e,t)).token}async function K(e){let{registrationPromise:t}=await B(e);t&&await t}function z(e){return u.create("missing-app-config-values",{valueName:e})}/**
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
 */let W="installations";(0,i.Xd)(new r.wA(W,e=>{let t=e.getProvider("app").getImmediate(),n=/**
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
 */function(e){if(!e||!e.options)throw z("App Configuration");if(!e.name)throw z("App Name");for(let t of["projectId","apiKey","appId"])if(!e.options[t])throw z(t);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}(t),r=(0,i.qX)(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},"PUBLIC")),(0,i.Xd)(new r.wA("installations-internal",e=>{let t=e.getProvider("app").getImmediate(),n=(0,i.qX)(t,W).getImmediate();return{getId:()=>U(n),getToken:e=>V(n,e)}},"PRIVATE")),(0,i.KN)(a,c),(0,i.KN)(a,c,"esm2017")},6914:function(e,t,n){"use strict";var i,r;n.d(t,{Yd:function(){return h}});/**
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
 */let s=[];(r=i||(i={}))[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT";let o={debug:i.DEBUG,verbose:i.VERBOSE,info:i.INFO,warn:i.WARN,error:i.ERROR,silent:i.SILENT},a=i.INFO,c={[i.DEBUG]:"log",[i.VERBOSE]:"log",[i.INFO]:"info",[i.WARN]:"warn",[i.ERROR]:"error"},l=(e,t,...n)=>{if(t<e.logLevel)return;let i=new Date().toISOString(),r=c[t];if(r)console[r](`[${i}]  ${e.name}:`,...n);else throw Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class h{constructor(e){this.name=e,this._logLevel=a,this._logHandler=l,this._userLogHandler=null,s.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in i))throw TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?o[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,i.DEBUG,...e),this._logHandler(this,i.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,i.VERBOSE,...e),this._logHandler(this,i.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,i.INFO,...e),this._logHandler(this,i.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,i.WARN,...e),this._logHandler(this,i.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,i.ERROR,...e),this._logHandler(this,i.ERROR,...e)}}},2657:function(e,t,n){"use strict";let i,r,s,o;n.d(t,{IH:function(){return N}});var a=n(206),c=n(6914),l=n(8745),h=n(5538);n(2334);/**
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
 */let u="analytics",d="https://www.googletagmanager.com/gtag/js",p=new c.Yd("@firebase/analytics"),f=new l.LL("analytics","Analytics",{"already-exists":"A Firebase Analytics instance with the appId {$id}  already exists. Only one Firebase Analytics instance can be created for each appId.","already-initialized":"initializeAnalytics() cannot be called again with different options than those it was initially called with. It can be called again with the same options to return the existing instance, or getAnalytics() can be used to get a reference to the already-initialized instance.","already-initialized-settings":"Firebase Analytics has already been initialized.settings() must be called before initializing any Analytics instanceor it will have no effect.","interop-component-reg-failed":"Firebase Analytics Interop Component failed to instantiate: {$reason}","invalid-analytics-context":"Firebase Analytics is not supported in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","indexeddb-unavailable":"IndexedDB unavailable or restricted in this environment. Wrap initialization of analytics in analytics.isSupported() to prevent initialization in unsupported environments. Details: {$errorInfo}","fetch-throttle":"The config fetch request timed out while in an exponential backoff state. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.","config-fetch-failed":"Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}","no-api-key":'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid API key.',"no-app-id":'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field tocontain a valid app ID.',"no-client-id":'The "client_id" field is empty.',"invalid-gtag-resource":"Trusted Types detected an invalid gtag resource: {$gtagURL}."});/**
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
 */function g(e){if(!e.startsWith(d)){let t=f.create("invalid-gtag-resource",{gtagURL:e});return p.warn(t.message),""}return e}function m(e){return Promise.all(e.map(e=>e.catch(e=>e)))}async function y(e,t,n,i,r,s){let o=i[r];try{if(o)await t[o];else{let e=(await m(n)).find(e=>e.measurementId===r);e&&await t[e.appId]}}catch(e){p.error(e)}e("config",r,s)}async function b(e,t,n,i,r){try{let s=[];if(r&&r.send_to){let e=r.send_to;Array.isArray(e)||(e=[e]);let i=await m(n);for(let n of e){let e=i.find(e=>e.measurementId===n),r=e&&t[e.appId];if(r)s.push(r);else{s=[];break}}}0===s.length&&(s=Object.values(t)),await Promise.all(s),e("event",i,r||{})}catch(e){p.error(e)}}class w{constructor(e={},t=1e3){this.throttleMetadata=e,this.intervalMillis=t}getThrottleMetadata(e){return this.throttleMetadata[e]}setThrottleMetadata(e,t){this.throttleMetadata[e]=t}deleteThrottleMetadata(e){delete this.throttleMetadata[e]}}let v=new w;async function _(e){var t;let{appId:n,apiKey:i}=e,r={method:"GET",headers:new Headers({Accept:"application/json","x-goog-api-key":i})},s="https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig".replace("{app-id}",n),o=await fetch(s,r);if(200!==o.status&&304!==o.status){let e="";try{let n=await o.json();(null===(t=n.error)||void 0===t?void 0:t.message)&&(e=n.error.message)}catch(e){}throw f.create("config-fetch-failed",{httpStatus:o.status,responseMessage:e})}return o.json()}async function k(e,t=v,n){let{appId:i,apiKey:r,measurementId:s}=e.options;if(!i)throw f.create("no-app-id");if(!r){if(s)return{measurementId:s,appId:i};throw f.create("no-api-key")}let o=t.getThrottleMetadata(i)||{backoffCount:0,throttleEndTimeMillis:Date.now()},a=new I;return setTimeout(async()=>{a.abort()},void 0!==n?n:6e4),E({appId:i,apiKey:r,measurementId:s},o,a,t)}async function E(e,{throttleEndTimeMillis:t,backoffCount:n},i,r=v){var s;let{appId:o,measurementId:a}=e;try{await new Promise((e,n)=>{let r=setTimeout(e,Math.max(t-Date.now(),0));i.addEventListener(()=>{clearTimeout(r),n(f.create("fetch-throttle",{throttleEndTimeMillis:t}))})})}catch(e){if(a)return p.warn(`Timed out fetching this Firebase app's measurement ID from the server. Falling back to the measurement ID ${a} provided in the "measurementId" field in the local Firebase config. [${null==e?void 0:e.message}]`),{appId:o,measurementId:a};throw e}try{let t=await _(e);return r.deleteThrottleMetadata(o),t}catch(h){if(!function(e){if(!(e instanceof l.ZR)||!e.customData)return!1;let t=Number(e.customData.httpStatus);return 429===t||500===t||503===t||504===t}(h)){if(r.deleteThrottleMetadata(o),a)return p.warn(`Failed to fetch this Firebase app's measurement ID from the server. Falling back to the measurement ID ${a} provided in the "measurementId" field in the local Firebase config. [${null==h?void 0:h.message}]`),{appId:o,measurementId:a};throw h}let t=503===Number(null===(s=null==h?void 0:h.customData)||void 0===s?void 0:s.httpStatus)?(0,l.$s)(n,r.intervalMillis,30):(0,l.$s)(n,r.intervalMillis),c={throttleEndTimeMillis:Date.now()+t,backoffCount:n+1};return r.setThrottleMetadata(o,c),p.debug(`Calling attemptFetch again in ${t} millis`),E(e,c,i,r)}}class I{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach(e=>e())}}async function T(e,t,n,i,r){if(r&&r.global){e("event",n,i);return}{let r=await t;e("event",n,Object.assign(Object.assign({},i),{send_to:r}))}}/**
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
 */async function S(){if(!(0,l.hl)())return p.warn(f.create("indexeddb-unavailable",{errorInfo:"IndexedDB is not available in this environment."}).message),!1;try{await (0,l.eu)()}catch(e){return p.warn(f.create("indexeddb-unavailable",{errorInfo:null==e?void 0:e.toString()}).message),!1}return!0}async function A(e,t,n,s,o,a,c){var l;let h=k(e);h.then(t=>{n[t.measurementId]=t.appId,e.options.measurementId&&t.measurementId!==e.options.measurementId&&p.warn(`The measurement ID in the local Firebase config (${e.options.measurementId}) does not match the measurement ID fetched from the server (${t.measurementId}). To ensure analytics events are always sent to the correct Analytics property, update the measurement ID field in the local config or remove it from the local config.`)}).catch(e=>p.error(e)),t.push(h);let u=S().then(e=>e?s.getId():void 0),[f,m]=await Promise.all([h,u]);!function(e){for(let t of Object.values(window.document.getElementsByTagName("script")))if(t.src&&t.src.includes(d)&&t.src.includes(e))return t;return null}(a)&&function(e,t){let n;let i=(window.trustedTypes&&(n=window.trustedTypes.createPolicy("firebase-js-sdk-policy",{createScriptURL:g})),n),r=document.createElement("script"),s=`${d}?l=${e}&id=${t}`;r.src=i?null==i?void 0:i.createScriptURL(s):s,r.async=!0,document.head.appendChild(r)}(a,f.measurementId),r&&(o("consent","default",r),r=void 0),o("js",new Date);let y=null!==(l=null==c?void 0:c.config)&&void 0!==l?l:{};return y.origin="firebase",y.update=!0,null!=m&&(y.firebase_id=m),o("config",f.measurementId,y),i&&(o("set",i),i=void 0),f.measurementId}/**
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
 */class C{constructor(e){this.app=e}_delete(){return delete O[this.app.options.appId],Promise.resolve()}}let O={},D=[],L={},B="dataLayer",R=!1;function N(e=(0,a.Mq)()){e=(0,l.m9)(e);let t=(0,a.qX)(e,u);return t.isInitialized()?t.getImmediate():function(e,t={}){let n=(0,a.qX)(e,u);if(n.isInitialized()){let e=n.getImmediate();if((0,l.vZ)(t,n.getOptions()))return e;throw f.create("already-initialized")}return n.initialize({options:t})}(e)}let x="@firebase/analytics",P="0.10.8";(0,a.Xd)(new h.wA(u,(e,{options:t})=>(function(e,t,n){!function(){let e=[];if((0,l.ru)()&&e.push("This is a browser extension environment."),(0,l.zI)()||e.push("Cookies are not available."),e.length>0){let t=e.map((e,t)=>`(${t+1}) ${e}`).join(" "),n=f.create("invalid-analytics-context",{errorInfo:t});p.warn(n.message)}}();let i=e.options.appId;if(!i)throw f.create("no-app-id");if(!e.options.apiKey){if(e.options.measurementId)p.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest measurement ID for this Firebase app. Falling back to the measurement ID ${e.options.measurementId} provided in the "measurementId" field in the local Firebase config.`);else throw f.create("no-api-key")}if(null!=O[i])throw f.create("already-exists",{id:i});if(!R){var r,a;let e,t;e=[],Array.isArray(window[B])?e=window[B]:window[B]=e;let{wrappedGtag:n,gtagCore:i}=(r="gtag",t=function(...e){window[B].push(arguments)},window[r]&&"function"==typeof window[r]&&(t=window[r]),window[r]=(a=t,async function(e,...t){try{if("event"===e){let[e,n]=t;await b(a,O,D,e,n)}else if("config"===e){let[e,n]=t;await y(a,O,D,L,e,n)}else if("consent"===e){let[e,n]=t;a("consent",e,n)}else if("get"===e){let[e,n,i]=t;a("get",e,n,i)}else if("set"===e){let[e]=t;a("set",e)}else a(e,...t)}catch(e){p.error(e)}}),{gtagCore:t,wrappedGtag:window[r]});o=n,s=i,R=!0}return O[i]=A(e,D,L,t,s,B,n),new C(e)})(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),t),"PUBLIC")),(0,a.Xd)(new h.wA("analytics-internal",function(e){try{let t=e.getProvider(u).getImmediate();return{logEvent:(e,n,i)=>{var r;return r=t,void(r=(0,l.m9)(r),T(o,O[r.app.options.appId],e,n,i).catch(e=>p.error(e)))}}}catch(e){throw f.create("interop-component-reg-failed",{reason:e})}},"PRIVATE")),(0,a.KN)(x,P),(0,a.KN)(x,P,"esm2017")},994:function(e,t,n){"use strict";n.d(t,{C6:function(){return i.C6},ZF:function(){return i.ZF}});var i=n(206);/**
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
 */(0,i.KN)("firebase","10.14.1","app")},8095:function(e,t,n){"use strict";n.d(t,{KL:function(){return K},LP:function(){return z},ps:function(){return W}}),n(2334);var i,r,s,o,a=n(5538),c=n(8542),l=n(8745),h=n(206);let u="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",d="google.c.a.c_id";/**
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
 */function p(e){return btoa(String.fromCharCode(...new Uint8Array(e))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}(i=s||(s={}))[i.DATA_MESSAGE=1]="DATA_MESSAGE",i[i.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION",(r=o||(o={})).PUSH_RECEIVED="push-received",r.NOTIFICATION_CLICKED="notification-clicked";/**
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
 */let f="fcm_token_details_db",g="fcm_token_object_Store";async function m(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(e=>e.name).includes(f))return null;let t=null;return(await (0,c.X3)(f,5,{upgrade:async(n,i,r,s)=>{var o;if(i<2||!n.objectStoreNames.contains(g))return;let a=s.objectStore(g),c=await a.index("fcmSenderId").get(e);if(await a.clear(),c){if(2===i){if(!c.auth||!c.p256dh||!c.endpoint)return;t={token:c.fcmToken,createTime:null!==(o=c.createTime)&&void 0!==o?o:Date.now(),subscriptionOptions:{auth:c.auth,p256dh:c.p256dh,endpoint:c.endpoint,swScope:c.swScope,vapidKey:"string"==typeof c.vapidKey?c.vapidKey:p(c.vapidKey)}}}else 3===i?t={token:c.fcmToken,createTime:c.createTime,subscriptionOptions:{auth:p(c.auth),p256dh:p(c.p256dh),endpoint:c.endpoint,swScope:c.swScope,vapidKey:p(c.vapidKey)}}:4===i&&(t={token:c.fcmToken,createTime:c.createTime,subscriptionOptions:{auth:p(c.auth),p256dh:p(c.p256dh),endpoint:c.endpoint,swScope:c.swScope,vapidKey:p(c.vapidKey)}})}}})).close(),await (0,c.Lj)(f),await (0,c.Lj)("fcm_vapid_details_db"),await (0,c.Lj)("undefined"),!function(e){if(!e||!e.subscriptionOptions)return!1;let{subscriptionOptions:t}=e;return"number"==typeof e.createTime&&e.createTime>0&&"string"==typeof e.token&&e.token.length>0&&"string"==typeof t.auth&&t.auth.length>0&&"string"==typeof t.p256dh&&t.p256dh.length>0&&"string"==typeof t.endpoint&&t.endpoint.length>0&&"string"==typeof t.swScope&&t.swScope.length>0&&"string"==typeof t.vapidKey&&t.vapidKey.length>0}(t)?null:t}let y="firebase-messaging-store",b=null;function w(){return b||(b=(0,c.X3)("firebase-messaging-database",1,{upgrade:(e,t)=>{0===t&&e.createObjectStore(y)}})),b}async function v(e){let t=function({appConfig:e}){return e.appId}(e),n=await w(),i=await n.transaction(y).objectStore(y).get(t);if(i)return i;{let t=await m(e.appConfig.senderId);if(t)return await _(e,t),t}}async function _(e,t){let n=function({appConfig:e}){return e.appId}(e),i=(await w()).transaction(y,"readwrite");return await i.objectStore(y).put(t,n),await i.done,t}let k=new l.LL("messaging","Messaging",{"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."});/**
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
 */async function E(e,t){let n;let i={method:"POST",headers:await A(e),body:JSON.stringify(C(t))};try{let t=await fetch(S(e.appConfig),i);n=await t.json()}catch(e){throw k.create("token-subscribe-failed",{errorInfo:null==e?void 0:e.toString()})}if(n.error){let e=n.error.message;throw k.create("token-subscribe-failed",{errorInfo:e})}if(!n.token)throw k.create("token-subscribe-no-token");return n.token}async function I(e,t){let n;let i={method:"PATCH",headers:await A(e),body:JSON.stringify(C(t.subscriptionOptions))};try{let r=await fetch(`${S(e.appConfig)}/${t.token}`,i);n=await r.json()}catch(e){throw k.create("token-update-failed",{errorInfo:null==e?void 0:e.toString()})}if(n.error){let e=n.error.message;throw k.create("token-update-failed",{errorInfo:e})}if(!n.token)throw k.create("token-update-no-token");return n.token}async function T(e,t){let n=await A(e);try{let i=await fetch(`${S(e.appConfig)}/${t}`,{method:"DELETE",headers:n}),r=await i.json();if(r.error){let e=r.error.message;throw k.create("token-unsubscribe-failed",{errorInfo:e})}}catch(e){throw k.create("token-unsubscribe-failed",{errorInfo:null==e?void 0:e.toString()})}}function S({projectId:e}){return`https://fcmregistrations.googleapis.com/v1/projects/${e}/registrations`}async function A({appConfig:e,installations:t}){let n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function C({p256dh:e,auth:t,endpoint:n,vapidKey:i}){let r={web:{endpoint:n,auth:t,p256dh:e}};return i!==u&&(r.web.applicationPubKey=i),r}async function O(e){let t=await B(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:p(t.getKey("auth")),p256dh:p(t.getKey("p256dh"))},i=await v(e.firebaseDependencies);if(!i)return L(e.firebaseDependencies,n);if(function(e,t){let n=t.vapidKey===e.vapidKey,i=t.endpoint===e.endpoint,r=t.auth===e.auth,s=t.p256dh===e.p256dh;return n&&i&&r&&s}(i.subscriptionOptions,n))return Date.now()>=i.createTime+6048e5?D(e,{token:i.token,createTime:Date.now(),subscriptionOptions:n}):i.token;try{await T(e.firebaseDependencies,i.token)}catch(e){console.warn(e)}return L(e.firebaseDependencies,n)}async function D(e,t){try{let n=await I(e.firebaseDependencies,t),i=Object.assign(Object.assign({},t),{token:n,createTime:Date.now()});return await _(e.firebaseDependencies,i),n}catch(e){throw e}}async function L(e,t){let n={token:await E(e,t),createTime:Date.now(),subscriptionOptions:t};return await _(e,n),n.token}async function B(e,t){return await e.pushManager.getSubscription()||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:function(e){let t="=".repeat((4-e.length%4)%4),n=atob((e+t).replace(/\-/g,"+").replace(/_/g,"/")),i=new Uint8Array(n.length);for(let e=0;e<n.length;++e)i[e]=n.charCodeAt(e);return i}(t)})}/**
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
 */function R(e){let t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return function(e,t){if(!t.notification)return;e.notification={};let n=t.notification.title;n&&(e.notification.title=n);let i=t.notification.body;i&&(e.notification.body=i);let r=t.notification.image;r&&(e.notification.image=r);let s=t.notification.icon;s&&(e.notification.icon=s)}(t,e),e.data&&(t.data=e.data),function(e,t){var n,i,r,s,o;if(!t.fcmOptions&&!(null===(n=t.notification)||void 0===n?void 0:n.click_action))return;e.fcmOptions={};let a=null!==(r=null===(i=t.fcmOptions)||void 0===i?void 0:i.link)&&void 0!==r?r:null===(s=t.notification)||void 0===s?void 0:s.click_action;a&&(e.fcmOptions.link=a);let c=null===(o=t.fcmOptions)||void 0===o?void 0:o.analytics_label;c&&(e.fcmOptions.analyticsLabel=c)}(t,e),t}function N(e){return k.create("missing-app-config-values",{valueName:e})}!/**
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
 */class x{constructor(e,t,n){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;let i=/**
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
 */function(e){if(!e||!e.options)throw N("App Configuration Object");if(!e.name)throw N("App Name");let{options:t}=e;for(let e of["projectId","apiKey","appId","messagingSenderId"])if(!t[e])throw N(e);return{appName:e.name,projectId:t.projectId,apiKey:t.apiKey,appId:t.appId,senderId:t.messagingSenderId}}(e);this.firebaseDependencies={app:e,appConfig:i,installations:t,analyticsProvider:n}}_delete(){return Promise.resolve()}}/**
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
 */async function P(e){try{e.swRegistration=await navigator.serviceWorker.register("/firebase-messaging-sw.js",{scope:"/firebase-cloud-messaging-push-scope"}),e.swRegistration.update().catch(()=>{})}catch(e){throw k.create("failed-service-worker-registration",{browserErrorMessage:null==e?void 0:e.message})}}/**
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
 */async function j(e,t){if(t||e.swRegistration||await P(e),t||!e.swRegistration){if(!(t instanceof ServiceWorkerRegistration))throw k.create("invalid-sw-registration");e.swRegistration=t}}/**
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
 */async function M(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=u)}/**
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
 */async function F(e,t){if(!navigator)throw k.create("only-available-in-window");if("default"===Notification.permission&&await Notification.requestPermission(),"granted"!==Notification.permission)throw k.create("permission-blocked");return await M(e,null==t?void 0:t.vapidKey),await j(e,null==t?void 0:t.serviceWorkerRegistration),O(e)}/**
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
 */async function $(e,t,n){let i=function(e){switch(e){case o.NOTIFICATION_CLICKED:return"notification_open";case o.PUSH_RECEIVED:return"notification_foreground";default:throw Error()}}(t);(await e.firebaseDependencies.analyticsProvider.get()).logEvent(i,{message_id:n[d],message_name:n["google.c.a.c_l"],message_time:n["google.c.a.ts"],message_device_time:Math.floor(Date.now()/1e3)})}/**
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
 */async function q(e,t){let n=t.data;if(!n.isFirebaseMessaging)return;e.onMessageHandler&&n.messageType===o.PUSH_RECEIVED&&("function"==typeof e.onMessageHandler?e.onMessageHandler(R(n)):e.onMessageHandler.next(R(n)));let i=n.data;"object"==typeof i&&i&&d in i&&"1"===i["google.c.a.e"]&&await $(e,n.messageType,i)}let H="@firebase/messaging",U="0.12.12";/**
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
 */function K(e=(0,h.Mq)()){return V().then(e=>{if(!e)throw k.create("unsupported-browser")},e=>{throw k.create("indexed-db-unsupported")}),(0,h.qX)((0,l.m9)(e),"messaging").getImmediate()}async function z(e,t){return F(e=(0,l.m9)(e),t)}function W(e,t){return(/**
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
 */function(e,t){if(!navigator)throw k.create("only-available-in-window");return e.onMessageHandler=t,()=>{e.onMessageHandler=null}}(e=(0,l.m9)(e),t))}(0,h.Xd)(new a.wA("messaging",e=>{let t=new x(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",e=>q(t,e)),t},"PUBLIC")),(0,h.Xd)(new a.wA("messaging-internal",e=>{let t=e.getProvider("messaging").getImmediate();return{getToken:e=>F(t,e)}},"PRIVATE")),(0,h.KN)(H,U),(0,h.KN)(H,U,"esm2017")},8542:function(e,t,n){"use strict";var i;let r,s;n.d(t,{Lj:function(){return m},X3:function(){return g}});let o=(e,t)=>t.some(t=>e instanceof t),a=new WeakMap,c=new WeakMap,l=new WeakMap,h=new WeakMap,u=new WeakMap,d={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return c.get(e);if("objectStoreNames"===t)return e.objectStoreNames||l.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return p(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function p(e){var t;if(e instanceof IDBRequest)return function(e){let t=new Promise((t,n)=>{let i=()=>{e.removeEventListener("success",r),e.removeEventListener("error",s)},r=()=>{t(p(e.result)),i()},s=()=>{n(e.error),i()};e.addEventListener("success",r),e.addEventListener("error",s)});return t.then(t=>{t instanceof IDBCursor&&a.set(t,e)}).catch(()=>{}),u.set(t,e),t}(e);if(h.has(e))return h.get(e);let n="function"==typeof(t=e)?t!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(s||(s=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(t)?function(...e){return t.apply(f(this),e),p(a.get(this))}:function(...e){return p(t.apply(f(this),e))}:function(e,...n){let i=t.call(f(this),e,...n);return l.set(i,e.sort?e.sort():[e]),p(i)}:(t instanceof IDBTransaction&&function(e){if(c.has(e))return;let t=new Promise((t,n)=>{let i=()=>{e.removeEventListener("complete",r),e.removeEventListener("error",s),e.removeEventListener("abort",s)},r=()=>{t(),i()},s=()=>{n(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",r),e.addEventListener("error",s),e.addEventListener("abort",s)});c.set(e,t)}(t),o(t,r||(r=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])))?new Proxy(t,d):t;return n!==e&&(h.set(e,n),u.set(n,e)),n}let f=e=>u.get(e);function g(e,t,{blocked:n,upgrade:i,blocking:r,terminated:s}={}){let o=indexedDB.open(e,t),a=p(o);return i&&o.addEventListener("upgradeneeded",e=>{i(p(o.result),e.oldVersion,e.newVersion,p(o.transaction),e)}),n&&o.addEventListener("blocked",e=>n(e.oldVersion,e.newVersion,e)),a.then(e=>{s&&e.addEventListener("close",()=>s()),r&&e.addEventListener("versionchange",e=>r(e.oldVersion,e.newVersion,e))}).catch(()=>{}),a}function m(e,{blocked:t}={}){let n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",e=>t(e.oldVersion,e)),p(n).then(()=>void 0)}let y=["get","getKey","getAll","getAllKeys","count"],b=["put","add","delete","clear"],w=new Map;function v(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&"string"==typeof t))return;if(w.get(t))return w.get(t);let n=t.replace(/FromIndex$/,""),i=t!==n,r=b.includes(n);if(!(n in(i?IDBIndex:IDBObjectStore).prototype)||!(r||y.includes(n)))return;let s=async function(e,...t){let s=this.transaction(e,r?"readwrite":"readonly"),o=s.store;return i&&(o=o.index(t.shift())),(await Promise.all([o[n](...t),r&&s.done]))[0]};return w.set(t,s),s}d={...i=d,get:(e,t,n)=>v(e,t)||i.get(e,t,n),has:(e,t)=>!!v(e,t)||i.has(e,t)}},4337:function(e,t,n){"use strict";let i,r;n.d(t,{io:function(){return eS}});var s,o,a={};n.r(a),n.d(a,{Decoder:function(){return eb},Encoder:function(){return em},PacketType:function(){return o},protocol:function(){return eg}});let c=Object.create(null);c.open="0",c.close="1",c.ping="2",c.pong="3",c.message="4",c.upgrade="5",c.noop="6";let l=Object.create(null);Object.keys(c).forEach(e=>{l[c[e]]=e});let h={type:"error",data:"parser error"},u="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===Object.prototype.toString.call(Blob),d="function"==typeof ArrayBuffer,p=e=>"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer instanceof ArrayBuffer,f=({type:e,data:t},n,i)=>u&&t instanceof Blob?n?i(t):g(t,i):d&&(t instanceof ArrayBuffer||p(t))?n?i(t):g(new Blob([t]),i):i(c[e]+(t||"")),g=(e,t)=>{let n=new FileReader;return n.onload=function(){t("b"+(n.result.split(",")[1]||""))},n.readAsDataURL(e)};function m(e){return e instanceof Uint8Array?e:e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}let y="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",b="undefined"==typeof Uint8Array?[]:new Uint8Array(256);for(let e=0;e<y.length;e++)b[y.charCodeAt(e)]=e;let w=e=>{let t=.75*e.length,n=e.length,i,r=0,s,o,a,c;"="===e[e.length-1]&&(t--,"="===e[e.length-2]&&t--);let l=new ArrayBuffer(t),h=new Uint8Array(l);for(i=0;i<n;i+=4)s=b[e.charCodeAt(i)],o=b[e.charCodeAt(i+1)],a=b[e.charCodeAt(i+2)],c=b[e.charCodeAt(i+3)],h[r++]=s<<2|o>>4,h[r++]=(15&o)<<4|a>>2,h[r++]=(3&a)<<6|63&c;return l},v="function"==typeof ArrayBuffer,_=(e,t)=>{if("string"!=typeof e)return{type:"message",data:E(e,t)};let n=e.charAt(0);return"b"===n?{type:"message",data:k(e.substring(1),t)}:l[n]?e.length>1?{type:l[n],data:e.substring(1)}:{type:l[n]}:h},k=(e,t)=>v?E(w(e),t):{base64:!0,data:e},E=(e,t)=>"blob"===t?e instanceof Blob?e:new Blob([e]):e instanceof ArrayBuffer?e:e.buffer,I=(e,t)=>{let n=e.length,i=Array(n),r=0;e.forEach((e,s)=>{f(e,!1,e=>{i[s]=e,++r===n&&t(i.join("\x1e"))})})},T=(e,t)=>{let n=e.split("\x1e"),i=[];for(let e=0;e<n.length;e++){let r=_(n[e],t);if(i.push(r),"error"===r.type)break}return i};function S(e){return e.reduce((e,t)=>e+t.length,0)}function A(e,t){if(e[0].length===t)return e.shift();let n=new Uint8Array(t),i=0;for(let r=0;r<t;r++)n[r]=e[0][i++],i===e[0].length&&(e.shift(),i=0);return e.length&&i<e[0].length&&(e[0]=e[0].slice(i)),n}function C(e){if(e)return function(e){for(var t in C.prototype)e[t]=C.prototype[t];return e}(e)}C.prototype.on=C.prototype.addEventListener=function(e,t){return this._callbacks=this._callbacks||{},(this._callbacks["$"+e]=this._callbacks["$"+e]||[]).push(t),this},C.prototype.once=function(e,t){function n(){this.off(e,n),t.apply(this,arguments)}return n.fn=t,this.on(e,n),this},C.prototype.off=C.prototype.removeListener=C.prototype.removeAllListeners=C.prototype.removeEventListener=function(e,t){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n,i=this._callbacks["$"+e];if(!i)return this;if(1==arguments.length)return delete this._callbacks["$"+e],this;for(var r=0;r<i.length;r++)if((n=i[r])===t||n.fn===t){i.splice(r,1);break}return 0===i.length&&delete this._callbacks["$"+e],this},C.prototype.emit=function(e){this._callbacks=this._callbacks||{};for(var t=Array(arguments.length-1),n=this._callbacks["$"+e],i=1;i<arguments.length;i++)t[i-1]=arguments[i];if(n){n=n.slice(0);for(var i=0,r=n.length;i<r;++i)n[i].apply(this,t)}return this},C.prototype.emitReserved=C.prototype.emit,C.prototype.listeners=function(e){return this._callbacks=this._callbacks||{},this._callbacks["$"+e]||[]},C.prototype.hasListeners=function(e){return!!this.listeners(e).length};let O="function"==typeof Promise&&"function"==typeof Promise.resolve?e=>Promise.resolve().then(e):(e,t)=>t(e,0),D="undefined"!=typeof self?self:"undefined"!=typeof window?window:Function("return this")();function L(e,...t){return t.reduce((t,n)=>(e.hasOwnProperty(n)&&(t[n]=e[n]),t),{})}let B=D.setTimeout,R=D.clearTimeout;function N(e,t){t.useNativeTimers?(e.setTimeoutFn=B.bind(D),e.clearTimeoutFn=R.bind(D)):(e.setTimeoutFn=D.setTimeout.bind(D),e.clearTimeoutFn=D.clearTimeout.bind(D))}function x(){return Date.now().toString(36).substring(3)+Math.random().toString(36).substring(2,5)}class P extends Error{constructor(e,t,n){super(e),this.description=t,this.context=n,this.type="TransportError"}}class j extends C{constructor(e){super(),this.writable=!1,N(this,e),this.opts=e,this.query=e.query,this.socket=e.socket,this.supportsBinary=!e.forceBase64}onError(e,t,n){return super.emitReserved("error",new P(e,t,n)),this}open(){return this.readyState="opening",this.doOpen(),this}close(){return("opening"===this.readyState||"open"===this.readyState)&&(this.doClose(),this.onClose()),this}send(e){"open"===this.readyState&&this.write(e)}onOpen(){this.readyState="open",this.writable=!0,super.emitReserved("open")}onData(e){let t=_(e,this.socket.binaryType);this.onPacket(t)}onPacket(e){super.emitReserved("packet",e)}onClose(e){this.readyState="closed",super.emitReserved("close",e)}pause(e){}createUri(e,t={}){return e+"://"+this._hostname()+this._port()+this.opts.path+this._query(t)}_hostname(){let e=this.opts.hostname;return -1===e.indexOf(":")?e:"["+e+"]"}_port(){return this.opts.port&&(this.opts.secure&&Number(443!==this.opts.port)||!this.opts.secure&&80!==Number(this.opts.port))?":"+this.opts.port:""}_query(e){let t=function(e){let t="";for(let n in e)e.hasOwnProperty(n)&&(t.length&&(t+="&"),t+=encodeURIComponent(n)+"="+encodeURIComponent(e[n]));return t}(e);return t.length?"?"+t:""}}class M extends j{constructor(){super(...arguments),this._polling=!1}get name(){return"polling"}doOpen(){this._poll()}pause(e){this.readyState="pausing";let t=()=>{this.readyState="paused",e()};if(this._polling||!this.writable){let e=0;this._polling&&(e++,this.once("pollComplete",function(){--e||t()})),this.writable||(e++,this.once("drain",function(){--e||t()}))}else t()}_poll(){this._polling=!0,this.doPoll(),this.emitReserved("poll")}onData(e){T(e,this.socket.binaryType).forEach(e=>{if("opening"===this.readyState&&"open"===e.type&&this.onOpen(),"close"===e.type)return this.onClose({description:"transport closed by the server"}),!1;this.onPacket(e)}),"closed"!==this.readyState&&(this._polling=!1,this.emitReserved("pollComplete"),"open"===this.readyState&&this._poll())}doClose(){let e=()=>{this.write([{type:"close"}])};"open"===this.readyState?e():this.once("open",e)}write(e){this.writable=!1,I(e,e=>{this.doWrite(e,()=>{this.writable=!0,this.emitReserved("drain")})})}uri(){let e=this.opts.secure?"https":"http",t=this.query||{};return!1!==this.opts.timestampRequests&&(t[this.opts.timestampParam]=x()),this.supportsBinary||t.sid||(t.b64=1),this.createUri(e,t)}}let F=!1;try{F="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest}catch(e){}let $=F;function q(){}class H extends M{constructor(e){if(super(e),"undefined"!=typeof location){let t="https:"===location.protocol,n=location.port;n||(n=t?"443":"80"),this.xd="undefined"!=typeof location&&e.hostname!==location.hostname||n!==e.port}}doWrite(e,t){let n=this.request({method:"POST",data:e});n.on("success",t),n.on("error",(e,t)=>{this.onError("xhr post error",e,t)})}doPoll(){let e=this.request();e.on("data",this.onData.bind(this)),e.on("error",(e,t)=>{this.onError("xhr poll error",e,t)}),this.pollXhr=e}}class U extends C{constructor(e,t,n){super(),this.createRequest=e,N(this,n),this._opts=n,this._method=n.method||"GET",this._uri=t,this._data=void 0!==n.data?n.data:null,this._create()}_create(){var e;let t=L(this._opts,"agent","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","autoUnref");t.xdomain=!!this._opts.xd;let n=this._xhr=this.createRequest(t);try{n.open(this._method,this._uri,!0);try{if(this._opts.extraHeaders)for(let e in n.setDisableHeaderCheck&&n.setDisableHeaderCheck(!0),this._opts.extraHeaders)this._opts.extraHeaders.hasOwnProperty(e)&&n.setRequestHeader(e,this._opts.extraHeaders[e])}catch(e){}if("POST"===this._method)try{n.setRequestHeader("Content-type","text/plain;charset=UTF-8")}catch(e){}try{n.setRequestHeader("Accept","*/*")}catch(e){}null===(e=this._opts.cookieJar)||void 0===e||e.addCookies(n),"withCredentials"in n&&(n.withCredentials=this._opts.withCredentials),this._opts.requestTimeout&&(n.timeout=this._opts.requestTimeout),n.onreadystatechange=()=>{var e;3===n.readyState&&(null===(e=this._opts.cookieJar)||void 0===e||e.parseCookies(n.getResponseHeader("set-cookie"))),4===n.readyState&&(200===n.status||1223===n.status?this._onLoad():this.setTimeoutFn(()=>{this._onError("number"==typeof n.status?n.status:0)},0))},n.send(this._data)}catch(e){this.setTimeoutFn(()=>{this._onError(e)},0);return}"undefined"!=typeof document&&(this._index=U.requestsCount++,U.requests[this._index]=this)}_onError(e){this.emitReserved("error",e,this._xhr),this._cleanup(!0)}_cleanup(e){if(void 0!==this._xhr&&null!==this._xhr){if(this._xhr.onreadystatechange=q,e)try{this._xhr.abort()}catch(e){}"undefined"!=typeof document&&delete U.requests[this._index],this._xhr=null}}_onLoad(){let e=this._xhr.responseText;null!==e&&(this.emitReserved("data",e),this.emitReserved("success"),this._cleanup())}abort(){this._cleanup()}}if(U.requestsCount=0,U.requests={},"undefined"!=typeof document){if("function"==typeof attachEvent)attachEvent("onunload",V);else if("function"==typeof addEventListener){let e="onpagehide"in D?"pagehide":"unload";addEventListener(e,V,!1)}}function V(){for(let e in U.requests)U.requests.hasOwnProperty(e)&&U.requests[e].abort()}let K=function(){let e=W({xdomain:!1});return e&&null!==e.responseType}();class z extends H{constructor(e){super(e);let t=e&&e.forceBase64;this.supportsBinary=K&&!t}request(e={}){return Object.assign(e,{xd:this.xd},this.opts),new U(W,this.uri(),e)}}function W(e){let t=e.xdomain;try{if("undefined"!=typeof XMLHttpRequest&&(!t||$))return new XMLHttpRequest}catch(e){}if(!t)try{return new D[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP")}catch(e){}}let X="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase();class Y extends j{get name(){return"websocket"}doOpen(){let e=this.uri(),t=this.opts.protocols,n=X?{}:L(this.opts,"agent","perMessageDeflate","pfx","key","passphrase","cert","ca","ciphers","rejectUnauthorized","localAddress","protocolVersion","origin","maxPayload","family","checkServerIdentity");this.opts.extraHeaders&&(n.headers=this.opts.extraHeaders);try{this.ws=this.createSocket(e,t,n)}catch(e){return this.emitReserved("error",e)}this.ws.binaryType=this.socket.binaryType,this.addEventListeners()}addEventListeners(){this.ws.onopen=()=>{this.opts.autoUnref&&this.ws._socket.unref(),this.onOpen()},this.ws.onclose=e=>this.onClose({description:"websocket connection closed",context:e}),this.ws.onmessage=e=>this.onData(e.data),this.ws.onerror=e=>this.onError("websocket error",e)}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],i=t===e.length-1;f(n,this.supportsBinary,e=>{try{this.doWrite(n,e)}catch(e){}i&&O(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){void 0!==this.ws&&(this.ws.onerror=()=>{},this.ws.close(),this.ws=null)}uri(){let e=this.opts.secure?"wss":"ws",t=this.query||{};return this.opts.timestampRequests&&(t[this.opts.timestampParam]=x()),this.supportsBinary||(t.b64=1),this.createUri(e,t)}}let J=D.WebSocket||D.MozWebSocket;class G extends Y{createSocket(e,t,n){return X?new J(e,t,n):t?new J(e,t):new J(e)}doWrite(e,t){this.ws.send(t)}}class Z extends j{get name(){return"webtransport"}doOpen(){try{this._transport=new WebTransport(this.createUri("https"),this.opts.transportOptions[this.name])}catch(e){return this.emitReserved("error",e)}this._transport.closed.then(()=>{this.onClose()}).catch(e=>{this.onError("webtransport error",e)}),this._transport.ready.then(()=>{this._transport.createBidirectionalStream().then(e=>{let t=function(e,t){r||(r=new TextDecoder);let n=[],i=0,s=-1,o=!1;return new TransformStream({transform(a,c){for(n.push(a);;){if(0===i){if(1>S(n))break;let e=A(n,1);o=(128&e[0])==128,i=(s=127&e[0])<126?3:126===s?1:2}else if(1===i){if(2>S(n))break;let e=A(n,2);s=new DataView(e.buffer,e.byteOffset,e.length).getUint16(0),i=3}else if(2===i){if(8>S(n))break;let e=A(n,8),t=new DataView(e.buffer,e.byteOffset,e.length),r=t.getUint32(0);if(r>2097151){c.enqueue(h);break}s=4294967296*r+t.getUint32(4),i=3}else{if(S(n)<s)break;let e=A(n,s);c.enqueue(_(o?e:r.decode(e),t)),i=0}if(0===s||s>e){c.enqueue(h);break}}}})}(Number.MAX_SAFE_INTEGER,this.socket.binaryType),n=e.readable.pipeThrough(t).getReader(),s=new TransformStream({transform(e,t){var n;n=n=>{let i;let r=n.length;if(r<126)i=new Uint8Array(1),new DataView(i.buffer).setUint8(0,r);else if(r<65536){i=new Uint8Array(3);let e=new DataView(i.buffer);e.setUint8(0,126),e.setUint16(1,r)}else{i=new Uint8Array(9);let e=new DataView(i.buffer);e.setUint8(0,127),e.setBigUint64(1,BigInt(r))}e.data&&"string"!=typeof e.data&&(i[0]|=128),t.enqueue(i),t.enqueue(n)},u&&e.data instanceof Blob?e.data.arrayBuffer().then(m).then(n):d&&(e.data instanceof ArrayBuffer||p(e.data))?n(m(e.data)):f(e,!1,e=>{i||(i=new TextEncoder),n(i.encode(e))})}});s.readable.pipeTo(e.writable),this._writer=s.writable.getWriter();let o=()=>{n.read().then(({done:e,value:t})=>{e||(this.onPacket(t),o())}).catch(e=>{})};o();let a={type:"open"};this.query.sid&&(a.data=`{"sid":"${this.query.sid}"}`),this._writer.write(a).then(()=>this.onOpen())})})}write(e){this.writable=!1;for(let t=0;t<e.length;t++){let n=e[t],i=t===e.length-1;this._writer.write(n).then(()=>{i&&O(()=>{this.writable=!0,this.emitReserved("drain")},this.setTimeoutFn)})}}doClose(){var e;null===(e=this._transport)||void 0===e||e.close()}}let Q={websocket:G,webtransport:Z,polling:z},ee=/^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,et=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];function en(e){if(e.length>8e3)throw"URI too long";let t=e,n=e.indexOf("["),i=e.indexOf("]");-1!=n&&-1!=i&&(e=e.substring(0,n)+e.substring(n,i).replace(/:/g,";")+e.substring(i,e.length));let r=ee.exec(e||""),s={},o=14;for(;o--;)s[et[o]]=r[o]||"";return -1!=n&&-1!=i&&(s.source=t,s.host=s.host.substring(1,s.host.length-1).replace(/;/g,":"),s.authority=s.authority.replace("[","").replace("]","").replace(/;/g,":"),s.ipv6uri=!0),s.pathNames=function(e,t){let n=t.replace(/\/{2,9}/g,"/").split("/");return("/"==t.slice(0,1)||0===t.length)&&n.splice(0,1),"/"==t.slice(-1)&&n.splice(n.length-1,1),n}(0,s.path),s.queryKey=function(e,t){let n={};return t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g,function(e,t,i){t&&(n[t]=i)}),n}(0,s.query),s}let ei="function"==typeof addEventListener&&"function"==typeof removeEventListener,er=[];ei&&addEventListener("offline",()=>{er.forEach(e=>e())},!1);class es extends C{constructor(e,t){if(super(),this.binaryType="arraybuffer",this.writeBuffer=[],this._prevBufferLen=0,this._pingInterval=-1,this._pingTimeout=-1,this._maxPayload=-1,this._pingTimeoutTime=1/0,e&&"object"==typeof e&&(t=e,e=null),e){let n=en(e);t.hostname=n.host,t.secure="https"===n.protocol||"wss"===n.protocol,t.port=n.port,n.query&&(t.query=n.query)}else t.host&&(t.hostname=en(t.host).host);N(this,t),this.secure=null!=t.secure?t.secure:"undefined"!=typeof location&&"https:"===location.protocol,t.hostname&&!t.port&&(t.port=this.secure?"443":"80"),this.hostname=t.hostname||("undefined"!=typeof location?location.hostname:"localhost"),this.port=t.port||("undefined"!=typeof location&&location.port?location.port:this.secure?"443":"80"),this.transports=[],this._transportsByName={},t.transports.forEach(e=>{let t=e.prototype.name;this.transports.push(t),this._transportsByName[t]=e}),this.opts=Object.assign({path:"/engine.io",agent:!1,withCredentials:!1,upgrade:!0,timestampParam:"t",rememberUpgrade:!1,addTrailingSlash:!0,rejectUnauthorized:!0,perMessageDeflate:{threshold:1024},transportOptions:{},closeOnBeforeunload:!1},t),this.opts.path=this.opts.path.replace(/\/$/,"")+(this.opts.addTrailingSlash?"/":""),"string"==typeof this.opts.query&&(this.opts.query=function(e){let t={},n=e.split("&");for(let e=0,i=n.length;e<i;e++){let i=n[e].split("=");t[decodeURIComponent(i[0])]=decodeURIComponent(i[1])}return t}(this.opts.query)),ei&&(this.opts.closeOnBeforeunload&&(this._beforeunloadEventListener=()=>{this.transport&&(this.transport.removeAllListeners(),this.transport.close())},addEventListener("beforeunload",this._beforeunloadEventListener,!1)),"localhost"!==this.hostname&&(this._offlineEventListener=()=>{this._onClose("transport close",{description:"network connection lost"})},er.push(this._offlineEventListener))),this.opts.withCredentials&&(this._cookieJar=void 0),this._open()}createTransport(e){let t=Object.assign({},this.opts.query);t.EIO=4,t.transport=e,this.id&&(t.sid=this.id);let n=Object.assign({},this.opts,{query:t,socket:this,hostname:this.hostname,secure:this.secure,port:this.port},this.opts.transportOptions[e]);return new this._transportsByName[e](n)}_open(){if(0===this.transports.length){this.setTimeoutFn(()=>{this.emitReserved("error","No transports available")},0);return}let e=this.opts.rememberUpgrade&&es.priorWebsocketSuccess&&-1!==this.transports.indexOf("websocket")?"websocket":this.transports[0];this.readyState="opening";let t=this.createTransport(e);t.open(),this.setTransport(t)}setTransport(e){this.transport&&this.transport.removeAllListeners(),this.transport=e,e.on("drain",this._onDrain.bind(this)).on("packet",this._onPacket.bind(this)).on("error",this._onError.bind(this)).on("close",e=>this._onClose("transport close",e))}onOpen(){this.readyState="open",es.priorWebsocketSuccess="websocket"===this.transport.name,this.emitReserved("open"),this.flush()}_onPacket(e){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(this.emitReserved("packet",e),this.emitReserved("heartbeat"),e.type){case"open":this.onHandshake(JSON.parse(e.data));break;case"ping":this._sendPacket("pong"),this.emitReserved("ping"),this.emitReserved("pong"),this._resetPingTimeout();break;case"error":let t=Error("server error");t.code=e.data,this._onError(t);break;case"message":this.emitReserved("data",e.data),this.emitReserved("message",e.data)}}onHandshake(e){this.emitReserved("handshake",e),this.id=e.sid,this.transport.query.sid=e.sid,this._pingInterval=e.pingInterval,this._pingTimeout=e.pingTimeout,this._maxPayload=e.maxPayload,this.onOpen(),"closed"!==this.readyState&&this._resetPingTimeout()}_resetPingTimeout(){this.clearTimeoutFn(this._pingTimeoutTimer);let e=this._pingInterval+this._pingTimeout;this._pingTimeoutTime=Date.now()+e,this._pingTimeoutTimer=this.setTimeoutFn(()=>{this._onClose("ping timeout")},e),this.opts.autoUnref&&this._pingTimeoutTimer.unref()}_onDrain(){this.writeBuffer.splice(0,this._prevBufferLen),this._prevBufferLen=0,0===this.writeBuffer.length?this.emitReserved("drain"):this.flush()}flush(){if("closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length){let e=this._getWritablePackets();this.transport.send(e),this._prevBufferLen=e.length,this.emitReserved("flush")}}_getWritablePackets(){if(!(this._maxPayload&&"polling"===this.transport.name&&this.writeBuffer.length>1))return this.writeBuffer;let e=1;for(let t=0;t<this.writeBuffer.length;t++){let n=this.writeBuffer[t].data;if(n&&(e+="string"==typeof n?function(e){let t=0,n=0;for(let i=0,r=e.length;i<r;i++)(t=e.charCodeAt(i))<128?n+=1:t<2048?n+=2:t<55296||t>=57344?n+=3:(i++,n+=4);return n}(n):Math.ceil(1.33*(n.byteLength||n.size))),t>0&&e>this._maxPayload)return this.writeBuffer.slice(0,t);e+=2}return this.writeBuffer}_hasPingExpired(){if(!this._pingTimeoutTime)return!0;let e=Date.now()>this._pingTimeoutTime;return e&&(this._pingTimeoutTime=0,O(()=>{this._onClose("ping timeout")},this.setTimeoutFn)),e}write(e,t,n){return this._sendPacket("message",e,t,n),this}send(e,t,n){return this._sendPacket("message",e,t,n),this}_sendPacket(e,t,n,i){if("function"==typeof t&&(i=t,t=void 0),"function"==typeof n&&(i=n,n=null),"closing"===this.readyState||"closed"===this.readyState)return;(n=n||{}).compress=!1!==n.compress;let r={type:e,data:t,options:n};this.emitReserved("packetCreate",r),this.writeBuffer.push(r),i&&this.once("flush",i),this.flush()}close(){let e=()=>{this._onClose("forced close"),this.transport.close()},t=()=>{this.off("upgrade",t),this.off("upgradeError",t),e()},n=()=>{this.once("upgrade",t),this.once("upgradeError",t)};return("opening"===this.readyState||"open"===this.readyState)&&(this.readyState="closing",this.writeBuffer.length?this.once("drain",()=>{this.upgrading?n():e()}):this.upgrading?n():e()),this}_onError(e){if(es.priorWebsocketSuccess=!1,this.opts.tryAllTransports&&this.transports.length>1&&"opening"===this.readyState)return this.transports.shift(),this._open();this.emitReserved("error",e),this._onClose("transport error",e)}_onClose(e,t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState){if(this.clearTimeoutFn(this._pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),ei&&(this._beforeunloadEventListener&&removeEventListener("beforeunload",this._beforeunloadEventListener,!1),this._offlineEventListener)){let e=er.indexOf(this._offlineEventListener);-1!==e&&er.splice(e,1)}this.readyState="closed",this.id=null,this.emitReserved("close",e,t),this.writeBuffer=[],this._prevBufferLen=0}}}es.protocol=4;class eo extends es{constructor(){super(...arguments),this._upgrades=[]}onOpen(){if(super.onOpen(),"open"===this.readyState&&this.opts.upgrade)for(let e=0;e<this._upgrades.length;e++)this._probe(this._upgrades[e])}_probe(e){let t=this.createTransport(e),n=!1;es.priorWebsocketSuccess=!1;let i=()=>{n||(t.send([{type:"ping",data:"probe"}]),t.once("packet",e=>{if(!n){if("pong"===e.type&&"probe"===e.data)this.upgrading=!0,this.emitReserved("upgrading",t),t&&(es.priorWebsocketSuccess="websocket"===t.name,this.transport.pause(()=>{n||"closed"===this.readyState||(l(),this.setTransport(t),t.send([{type:"upgrade"}]),this.emitReserved("upgrade",t),t=null,this.upgrading=!1,this.flush())}));else{let e=Error("probe error");e.transport=t.name,this.emitReserved("upgradeError",e)}}}))};function r(){n||(n=!0,l(),t.close(),t=null)}let s=e=>{let n=Error("probe error: "+e);n.transport=t.name,r(),this.emitReserved("upgradeError",n)};function o(){s("transport closed")}function a(){s("socket closed")}function c(e){t&&e.name!==t.name&&r()}let l=()=>{t.removeListener("open",i),t.removeListener("error",s),t.removeListener("close",o),this.off("close",a),this.off("upgrading",c)};t.once("open",i),t.once("error",s),t.once("close",o),this.once("close",a),this.once("upgrading",c),-1!==this._upgrades.indexOf("webtransport")&&"webtransport"!==e?this.setTimeoutFn(()=>{n||t.open()},200):t.open()}onHandshake(e){this._upgrades=this._filterUpgrades(e.upgrades),super.onHandshake(e)}_filterUpgrades(e){let t=[];for(let n=0;n<e.length;n++)~this.transports.indexOf(e[n])&&t.push(e[n]);return t}}class ea extends eo{constructor(e,t={}){let n="object"==typeof e?e:t;(!n.transports||n.transports&&"string"==typeof n.transports[0])&&(n.transports=(n.transports||["polling","websocket","webtransport"]).map(e=>Q[e]).filter(e=>!!e)),super(e,n)}}ea.protocol;let ec="function"==typeof ArrayBuffer,el=e=>"function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(e):e.buffer instanceof ArrayBuffer,eh=Object.prototype.toString,eu="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===eh.call(Blob),ed="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===eh.call(File);function ep(e){return ec&&(e instanceof ArrayBuffer||el(e))||eu&&e instanceof Blob||ed&&e instanceof File}let ef=["connect","connect_error","disconnect","disconnecting","newListener","removeListener"],eg=5;(s=o||(o={}))[s.CONNECT=0]="CONNECT",s[s.DISCONNECT=1]="DISCONNECT",s[s.EVENT=2]="EVENT",s[s.ACK=3]="ACK",s[s.CONNECT_ERROR=4]="CONNECT_ERROR",s[s.BINARY_EVENT=5]="BINARY_EVENT",s[s.BINARY_ACK=6]="BINARY_ACK";class em{constructor(e){this.replacer=e}encode(e){return(e.type===o.EVENT||e.type===o.ACK)&&function e(t,n){if(!t||"object"!=typeof t)return!1;if(Array.isArray(t)){for(let n=0,i=t.length;n<i;n++)if(e(t[n]))return!0;return!1}if(ep(t))return!0;if(t.toJSON&&"function"==typeof t.toJSON&&1==arguments.length)return e(t.toJSON(),!0);for(let n in t)if(Object.prototype.hasOwnProperty.call(t,n)&&e(t[n]))return!0;return!1}(e)?this.encodeAsBinary({type:e.type===o.EVENT?o.BINARY_EVENT:o.BINARY_ACK,nsp:e.nsp,data:e.data,id:e.id}):[this.encodeAsString(e)]}encodeAsString(e){let t=""+e.type;return(e.type===o.BINARY_EVENT||e.type===o.BINARY_ACK)&&(t+=e.attachments+"-"),e.nsp&&"/"!==e.nsp&&(t+=e.nsp+","),null!=e.id&&(t+=e.id),null!=e.data&&(t+=JSON.stringify(e.data,this.replacer)),t}encodeAsBinary(e){let t=function(e){let t=[],n=e.data;return e.data=function e(t,n){if(!t)return t;if(ep(t)){let e={_placeholder:!0,num:n.length};return n.push(t),e}if(Array.isArray(t)){let i=Array(t.length);for(let r=0;r<t.length;r++)i[r]=e(t[r],n);return i}if("object"==typeof t&&!(t instanceof Date)){let i={};for(let r in t)Object.prototype.hasOwnProperty.call(t,r)&&(i[r]=e(t[r],n));return i}return t}(n,t),e.attachments=t.length,{packet:e,buffers:t}}(e),n=this.encodeAsString(t.packet),i=t.buffers;return i.unshift(n),i}}function ey(e){return"[object Object]"===Object.prototype.toString.call(e)}class eb extends C{constructor(e){super(),this.reviver=e}add(e){let t;if("string"==typeof e){if(this.reconstructor)throw Error("got plaintext data when reconstructing a packet");let n=(t=this.decodeString(e)).type===o.BINARY_EVENT;n||t.type===o.BINARY_ACK?(t.type=n?o.EVENT:o.ACK,this.reconstructor=new ew(t),0===t.attachments&&super.emitReserved("decoded",t)):super.emitReserved("decoded",t)}else if(ep(e)||e.base64){if(this.reconstructor)(t=this.reconstructor.takeBinaryData(e))&&(this.reconstructor=null,super.emitReserved("decoded",t));else throw Error("got binary data when not reconstructing a packet")}else throw Error("Unknown type: "+e)}decodeString(e){let t=0,n={type:Number(e.charAt(0))};if(void 0===o[n.type])throw Error("unknown packet type "+n.type);if(n.type===o.BINARY_EVENT||n.type===o.BINARY_ACK){let i=t+1;for(;"-"!==e.charAt(++t)&&t!=e.length;);let r=e.substring(i,t);if(r!=Number(r)||"-"!==e.charAt(t))throw Error("Illegal attachments");n.attachments=Number(r)}if("/"===e.charAt(t+1)){let i=t+1;for(;++t&&","!==e.charAt(t)&&t!==e.length;);n.nsp=e.substring(i,t)}else n.nsp="/";let i=e.charAt(t+1);if(""!==i&&Number(i)==i){let i=t+1;for(;++t;){let n=e.charAt(t);if(null==n||Number(n)!=n){--t;break}if(t===e.length)break}n.id=Number(e.substring(i,t+1))}if(e.charAt(++t)){let i=this.tryParse(e.substr(t));if(eb.isPayloadValid(n.type,i))n.data=i;else throw Error("invalid payload")}return n}tryParse(e){try{return JSON.parse(e,this.reviver)}catch(e){return!1}}static isPayloadValid(e,t){switch(e){case o.CONNECT:return ey(t);case o.DISCONNECT:return void 0===t;case o.CONNECT_ERROR:return"string"==typeof t||ey(t);case o.EVENT:case o.BINARY_EVENT:return Array.isArray(t)&&("number"==typeof t[0]||"string"==typeof t[0]&&-1===ef.indexOf(t[0]));case o.ACK:case o.BINARY_ACK:return Array.isArray(t)}}destroy(){this.reconstructor&&(this.reconstructor.finishedReconstruction(),this.reconstructor=null)}}class ew{constructor(e){this.packet=e,this.buffers=[],this.reconPack=e}takeBinaryData(e){if(this.buffers.push(e),this.buffers.length===this.reconPack.attachments){var t,n;let e=(t=this.reconPack,n=this.buffers,t.data=function e(t,n){if(!t)return t;if(t&&!0===t._placeholder){if("number"==typeof t.num&&t.num>=0&&t.num<n.length)return n[t.num];throw Error("illegal attachments")}if(Array.isArray(t))for(let i=0;i<t.length;i++)t[i]=e(t[i],n);else if("object"==typeof t)for(let i in t)Object.prototype.hasOwnProperty.call(t,i)&&(t[i]=e(t[i],n));return t}(t.data,n),delete t.attachments,t);return this.finishedReconstruction(),e}return null}finishedReconstruction(){this.reconPack=null,this.buffers=[]}}function ev(e,t,n){return e.on(t,n),function(){e.off(t,n)}}let e_=Object.freeze({connect:1,connect_error:1,disconnect:1,disconnecting:1,newListener:1,removeListener:1});class ek extends C{constructor(e,t,n){super(),this.connected=!1,this.recovered=!1,this.receiveBuffer=[],this.sendBuffer=[],this._queue=[],this._queueSeq=0,this.ids=0,this.acks={},this.flags={},this.io=e,this.nsp=t,n&&n.auth&&(this.auth=n.auth),this._opts=Object.assign({},n),this.io._autoConnect&&this.open()}get disconnected(){return!this.connected}subEvents(){if(this.subs)return;let e=this.io;this.subs=[ev(e,"open",this.onopen.bind(this)),ev(e,"packet",this.onpacket.bind(this)),ev(e,"error",this.onerror.bind(this)),ev(e,"close",this.onclose.bind(this))]}get active(){return!!this.subs}connect(){return this.connected||(this.subEvents(),this.io._reconnecting||this.io.open(),"open"===this.io._readyState&&this.onopen()),this}open(){return this.connect()}send(...e){return e.unshift("message"),this.emit.apply(this,e),this}emit(e,...t){var n,i,r;if(e_.hasOwnProperty(e))throw Error('"'+e.toString()+'" is a reserved event name');if(t.unshift(e),this._opts.retries&&!this.flags.fromQueue&&!this.flags.volatile)return this._addToQueue(t),this;let s={type:o.EVENT,data:t};if(s.options={},s.options.compress=!1!==this.flags.compress,"function"==typeof t[t.length-1]){let e=this.ids++,n=t.pop();this._registerAckCallback(e,n),s.id=e}let a=null===(i=null===(n=this.io.engine)||void 0===n?void 0:n.transport)||void 0===i?void 0:i.writable,c=this.connected&&!(null===(r=this.io.engine)||void 0===r?void 0:r._hasPingExpired());return this.flags.volatile&&!a||(c?(this.notifyOutgoingListeners(s),this.packet(s)):this.sendBuffer.push(s)),this.flags={},this}_registerAckCallback(e,t){var n;let i=null!==(n=this.flags.timeout)&&void 0!==n?n:this._opts.ackTimeout;if(void 0===i){this.acks[e]=t;return}let r=this.io.setTimeoutFn(()=>{delete this.acks[e];for(let t=0;t<this.sendBuffer.length;t++)this.sendBuffer[t].id===e&&this.sendBuffer.splice(t,1);t.call(this,Error("operation has timed out"))},i),s=(...e)=>{this.io.clearTimeoutFn(r),t.apply(this,e)};s.withError=!0,this.acks[e]=s}emitWithAck(e,...t){return new Promise((n,i)=>{let r=(e,t)=>e?i(e):n(t);r.withError=!0,t.push(r),this.emit(e,...t)})}_addToQueue(e){let t;"function"==typeof e[e.length-1]&&(t=e.pop());let n={id:this._queueSeq++,tryCount:0,pending:!1,args:e,flags:Object.assign({fromQueue:!0},this.flags)};e.push((e,...i)=>{if(n===this._queue[0])return null!==e?n.tryCount>this._opts.retries&&(this._queue.shift(),t&&t(e)):(this._queue.shift(),t&&t(null,...i)),n.pending=!1,this._drainQueue()}),this._queue.push(n),this._drainQueue()}_drainQueue(e=!1){if(!this.connected||0===this._queue.length)return;let t=this._queue[0];(!t.pending||e)&&(t.pending=!0,t.tryCount++,this.flags=t.flags,this.emit.apply(this,t.args))}packet(e){e.nsp=this.nsp,this.io._packet(e)}onopen(){"function"==typeof this.auth?this.auth(e=>{this._sendConnectPacket(e)}):this._sendConnectPacket(this.auth)}_sendConnectPacket(e){this.packet({type:o.CONNECT,data:this._pid?Object.assign({pid:this._pid,offset:this._lastOffset},e):e})}onerror(e){this.connected||this.emitReserved("connect_error",e)}onclose(e,t){this.connected=!1,delete this.id,this.emitReserved("disconnect",e,t),this._clearAcks()}_clearAcks(){Object.keys(this.acks).forEach(e=>{if(!this.sendBuffer.some(t=>String(t.id)===e)){let t=this.acks[e];delete this.acks[e],t.withError&&t.call(this,Error("socket has been disconnected"))}})}onpacket(e){if(!(e.nsp!==this.nsp))switch(e.type){case o.CONNECT:e.data&&e.data.sid?this.onconnect(e.data.sid,e.data.pid):this.emitReserved("connect_error",Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));break;case o.EVENT:case o.BINARY_EVENT:this.onevent(e);break;case o.ACK:case o.BINARY_ACK:this.onack(e);break;case o.DISCONNECT:this.ondisconnect();break;case o.CONNECT_ERROR:this.destroy();let t=Error(e.data.message);t.data=e.data.data,this.emitReserved("connect_error",t)}}onevent(e){let t=e.data||[];null!=e.id&&t.push(this.ack(e.id)),this.connected?this.emitEvent(t):this.receiveBuffer.push(Object.freeze(t))}emitEvent(e){if(this._anyListeners&&this._anyListeners.length)for(let t of this._anyListeners.slice())t.apply(this,e);super.emit.apply(this,e),this._pid&&e.length&&"string"==typeof e[e.length-1]&&(this._lastOffset=e[e.length-1])}ack(e){let t=this,n=!1;return function(...i){n||(n=!0,t.packet({type:o.ACK,id:e,data:i}))}}onack(e){let t=this.acks[e.id];"function"==typeof t&&(delete this.acks[e.id],t.withError&&e.data.unshift(null),t.apply(this,e.data))}onconnect(e,t){this.id=e,this.recovered=t&&this._pid===t,this._pid=t,this.connected=!0,this.emitBuffered(),this.emitReserved("connect"),this._drainQueue(!0)}emitBuffered(){this.receiveBuffer.forEach(e=>this.emitEvent(e)),this.receiveBuffer=[],this.sendBuffer.forEach(e=>{this.notifyOutgoingListeners(e),this.packet(e)}),this.sendBuffer=[]}ondisconnect(){this.destroy(),this.onclose("io server disconnect")}destroy(){this.subs&&(this.subs.forEach(e=>e()),this.subs=void 0),this.io._destroy(this)}disconnect(){return this.connected&&this.packet({type:o.DISCONNECT}),this.destroy(),this.connected&&this.onclose("io client disconnect"),this}close(){return this.disconnect()}compress(e){return this.flags.compress=e,this}get volatile(){return this.flags.volatile=!0,this}timeout(e){return this.flags.timeout=e,this}onAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.push(e),this}prependAny(e){return this._anyListeners=this._anyListeners||[],this._anyListeners.unshift(e),this}offAny(e){if(!this._anyListeners)return this;if(e){let t=this._anyListeners;for(let n=0;n<t.length;n++)if(e===t[n]){t.splice(n,1);break}}else this._anyListeners=[];return this}listenersAny(){return this._anyListeners||[]}onAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.push(e),this}prependAnyOutgoing(e){return this._anyOutgoingListeners=this._anyOutgoingListeners||[],this._anyOutgoingListeners.unshift(e),this}offAnyOutgoing(e){if(!this._anyOutgoingListeners)return this;if(e){let t=this._anyOutgoingListeners;for(let n=0;n<t.length;n++)if(e===t[n]){t.splice(n,1);break}}else this._anyOutgoingListeners=[];return this}listenersAnyOutgoing(){return this._anyOutgoingListeners||[]}notifyOutgoingListeners(e){if(this._anyOutgoingListeners&&this._anyOutgoingListeners.length)for(let t of this._anyOutgoingListeners.slice())t.apply(this,e.data)}}function eE(e){e=e||{},this.ms=e.min||100,this.max=e.max||1e4,this.factor=e.factor||2,this.jitter=e.jitter>0&&e.jitter<=1?e.jitter:0,this.attempts=0}eE.prototype.duration=function(){var e=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var t=Math.random(),n=Math.floor(t*this.jitter*e);e=(1&Math.floor(10*t))==0?e-n:e+n}return 0|Math.min(e,this.max)},eE.prototype.reset=function(){this.attempts=0},eE.prototype.setMin=function(e){this.ms=e},eE.prototype.setMax=function(e){this.max=e},eE.prototype.setJitter=function(e){this.jitter=e};class eI extends C{constructor(e,t){var n;super(),this.nsps={},this.subs=[],e&&"object"==typeof e&&(t=e,e=void 0),(t=t||{}).path=t.path||"/socket.io",this.opts=t,N(this,t),this.reconnection(!1!==t.reconnection),this.reconnectionAttempts(t.reconnectionAttempts||1/0),this.reconnectionDelay(t.reconnectionDelay||1e3),this.reconnectionDelayMax(t.reconnectionDelayMax||5e3),this.randomizationFactor(null!==(n=t.randomizationFactor)&&void 0!==n?n:.5),this.backoff=new eE({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(null==t.timeout?2e4:t.timeout),this._readyState="closed",this.uri=e;let i=t.parser||a;this.encoder=new i.Encoder,this.decoder=new i.Decoder,this._autoConnect=!1!==t.autoConnect,this._autoConnect&&this.open()}reconnection(e){return arguments.length?(this._reconnection=!!e,e||(this.skipReconnect=!0),this):this._reconnection}reconnectionAttempts(e){return void 0===e?this._reconnectionAttempts:(this._reconnectionAttempts=e,this)}reconnectionDelay(e){var t;return void 0===e?this._reconnectionDelay:(this._reconnectionDelay=e,null===(t=this.backoff)||void 0===t||t.setMin(e),this)}randomizationFactor(e){var t;return void 0===e?this._randomizationFactor:(this._randomizationFactor=e,null===(t=this.backoff)||void 0===t||t.setJitter(e),this)}reconnectionDelayMax(e){var t;return void 0===e?this._reconnectionDelayMax:(this._reconnectionDelayMax=e,null===(t=this.backoff)||void 0===t||t.setMax(e),this)}timeout(e){return arguments.length?(this._timeout=e,this):this._timeout}maybeReconnectOnOpen(){!this._reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect()}open(e){if(~this._readyState.indexOf("open"))return this;this.engine=new ea(this.uri,this.opts);let t=this.engine,n=this;this._readyState="opening",this.skipReconnect=!1;let i=ev(t,"open",function(){n.onopen(),e&&e()}),r=t=>{this.cleanup(),this._readyState="closed",this.emitReserved("error",t),e?e(t):this.maybeReconnectOnOpen()},s=ev(t,"error",r);if(!1!==this._timeout){let e=this._timeout,n=this.setTimeoutFn(()=>{i(),r(Error("timeout")),t.close()},e);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}return this.subs.push(i),this.subs.push(s),this}connect(e){return this.open(e)}onopen(){this.cleanup(),this._readyState="open",this.emitReserved("open");let e=this.engine;this.subs.push(ev(e,"ping",this.onping.bind(this)),ev(e,"data",this.ondata.bind(this)),ev(e,"error",this.onerror.bind(this)),ev(e,"close",this.onclose.bind(this)),ev(this.decoder,"decoded",this.ondecoded.bind(this)))}onping(){this.emitReserved("ping")}ondata(e){try{this.decoder.add(e)}catch(e){this.onclose("parse error",e)}}ondecoded(e){O(()=>{this.emitReserved("packet",e)},this.setTimeoutFn)}onerror(e){this.emitReserved("error",e)}socket(e,t){let n=this.nsps[e];return n?this._autoConnect&&!n.active&&n.connect():(n=new ek(this,e,t),this.nsps[e]=n),n}_destroy(e){for(let e of Object.keys(this.nsps))if(this.nsps[e].active)return;this._close()}_packet(e){let t=this.encoder.encode(e);for(let n=0;n<t.length;n++)this.engine.write(t[n],e.options)}cleanup(){this.subs.forEach(e=>e()),this.subs.length=0,this.decoder.destroy()}_close(){this.skipReconnect=!0,this._reconnecting=!1,this.onclose("forced close")}disconnect(){return this._close()}onclose(e,t){var n;this.cleanup(),null===(n=this.engine)||void 0===n||n.close(),this.backoff.reset(),this._readyState="closed",this.emitReserved("close",e,t),this._reconnection&&!this.skipReconnect&&this.reconnect()}reconnect(){if(this._reconnecting||this.skipReconnect)return this;let e=this;if(this.backoff.attempts>=this._reconnectionAttempts)this.backoff.reset(),this.emitReserved("reconnect_failed"),this._reconnecting=!1;else{let t=this.backoff.duration();this._reconnecting=!0;let n=this.setTimeoutFn(()=>{!e.skipReconnect&&(this.emitReserved("reconnect_attempt",e.backoff.attempts),e.skipReconnect||e.open(t=>{t?(e._reconnecting=!1,e.reconnect(),this.emitReserved("reconnect_error",t)):e.onreconnect()}))},t);this.opts.autoUnref&&n.unref(),this.subs.push(()=>{this.clearTimeoutFn(n)})}}onreconnect(){let e=this.backoff.attempts;this._reconnecting=!1,this.backoff.reset(),this.emitReserved("reconnect",e)}}let eT={};function eS(e,t){let n;"object"==typeof e&&(t=e,e=void 0);let i=function(e,t="",n){let i=e;n=n||"undefined"!=typeof location&&location,null==e&&(e=n.protocol+"//"+n.host),"string"==typeof e&&("/"===e.charAt(0)&&(e="/"===e.charAt(1)?n.protocol+e:n.host+e),/^(https?|wss?):\/\//.test(e)||(e=void 0!==n?n.protocol+"//"+e:"https://"+e),i=en(e)),!i.port&&(/^(http|ws)$/.test(i.protocol)?i.port="80":/^(http|ws)s$/.test(i.protocol)&&(i.port="443")),i.path=i.path||"/";let r=-1!==i.host.indexOf(":")?"["+i.host+"]":i.host;return i.id=i.protocol+"://"+r+":"+i.port+t,i.href=i.protocol+"://"+r+(n&&n.port===i.port?"":":"+i.port),i}(e,(t=t||{}).path||"/socket.io"),r=i.source,s=i.id,o=i.path,a=eT[s]&&o in eT[s].nsps;return t.forceNew||t["force new connection"]||!1===t.multiplex||a?n=new eI(r,t):(eT[s]||(eT[s]=new eI(r,t)),n=eT[s]),i.query&&!t.query&&(t.query=i.queryKey),n.socket(i.path,t)}Object.assign(eS,{Manager:eI,Socket:ek,io:eS,connect:eS})}}]);