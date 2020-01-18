"use strict";function _toConsumableArray(e){return _arrayWithoutHoles(e)||_iterableToArray(e)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _arrayWithoutHoles(e){if(Array.isArray(e)){for(var t=0,r=new Array(e.length);t<e.length;t++)r[t]=e[t];return r}}function _slicedToArray(e,t){return _arrayWithHoles(e)||_iterableToArrayLimit(e,t)||_nonIterableRest()}function _iterableToArrayLimit(e,t){var r=[],n=!0,a=!1,i=void 0;try{for(var s,c=e[Symbol.iterator]();!(n=(s=c.next()).done)&&(r.push(s.value),!t||r.length!==t);n=!0);}catch(e){a=!0,i=e}finally{try{n||null==c.return||c.return()}finally{if(a)throw i}}return r}function _toArray(e){return _arrayWithHoles(e)||_iterableToArray(e)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArray(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}function _arrayWithHoles(e){if(Array.isArray(e))return e}function _typeof(e){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _defineProperties(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function _createClass(e,t,r){return t&&_defineProperties(e.prototype,t),r&&_defineProperties(e,r),e}var OM,OMNode,ref,scope,hasProp={}.hasOwnProperty,indexOf=[].indexOf,splice=[].splice;(OM=OMNode=function(){var x,e=function(){function S(e){_classCallCheck(this,S),this.encode=this.encode.bind(this),this.equals=this.equals.bind(this),this.sameObjectAs=this.sameObjectAs.bind(this),this.copy=this.copy.bind(this),this.simpleEncode=this.simpleEncode.bind(this),this.findInParent=this.findInParent.bind(this),this.findChild=this.findChild.bind(this),this.address=this.address.bind(this),this.index=this.index.bind(this),this.remove=this.remove.bind(this),this.replaceWith=this.replaceWith.bind(this),this.getAttribute=this.getAttribute.bind(this),this.removeAttribute=this.removeAttribute.bind(this),this.setAttribute=this.setAttribute.bind(this),this.freeVariables=this.freeVariables.bind(this),this.isFree=this.isFree.bind(this),this.occursFree=this.occursFree.bind(this),this.isFreeToReplace=this.isFreeToReplace.bind(this),this.replaceFree=this.replaceFree.bind(this),this.childrenSatisfying=this.childrenSatisfying.bind(this),this.descendantsSatisfying=this.descendantsSatisfying.bind(this),this.hasDescendantSatisfying=this.hasDescendantSatisfying.bind(this),this.tree=e,Object.defineProperty(this,"parent",{get:function(){return this.tree.p?new S(this.tree.p):void 0}}),Object.defineProperty(this,"type",{get:function(){return this.tree.t}}),Object.defineProperty(this,"value",{get:function(){return"bi"!==this.tree.t?this.tree.v:void 0}}),Object.defineProperty(this,"name",{get:function(){return this.tree.n}}),Object.defineProperty(this,"cd",{get:function(){return this.tree.cd}}),Object.defineProperty(this,"uri",{get:function(){return this.tree.uri}}),Object.defineProperty(this,"symbol",{get:function(){return this.tree.s?new S(this.tree.s):void 0}}),Object.defineProperty(this,"body",{get:function(){return this.tree.b?new S(this.tree.b):void 0}}),Object.defineProperty(this,"children",{get:function(){var e,t,r,n,a,i;for(i=[],t=0,r=(a=null!=(n=this.tree.c)?n:[]).length;t<r;t++)e=a[t],i.push(new S(e));return i}}),Object.defineProperty(this,"variables",{get:function(){var e,t,r,n,a;if("bi"!==this.tree.t)return[];for(n=[],e=0,t=(r=this.tree.v).length;e<t;e++)a=r[e],n.push(new S(a));return n}})}return _createClass(S,null,[{key:"checkJSON",value:function(s){var e,t,r,n,c,a,i,o,u,l,f,h,d,p,y,b,v,g;if(!(s instanceof Object))return"Expected an object, found ".concat(_typeof(s));if(s.hasOwnProperty("a"))for(c in h=s.a)if(hasProp.call(h,c)){v=h[c];try{b=JSON.parse(c)}catch(e){return e,"Key ".concat(c," invalid JSON")}if("sy"!==b.t)return"Key ".concat(c," is not a symbol");if(f=this.checkJSON(b))return f;if(f=this.checkJSON(v))return f}switch(e=function(){var e,t,r;r=Object.keys(s);for(var n=arguments.length,a=new Array(n),i=0;i<n;i++)a[i]=arguments[i];for(e=0,t=r.length;e<t;e++)if(c=r[e],indexOf.call(a,c)<0&&"t"!==c&&"a"!==c)return"Key ".concat(c," not valid in object of type ").concat(s.t);return null},r=/^[:A-Za-z_\u0374-\u03FF][:A-Za-z_\u0374-\u03FF.0-9-]*$/,s.t){case"i":if(f=e("v"))return f;if(!/^[+-]?[0-9]+$/.test("".concat(s.v)))return"Not an integer: ".concat(s.v);break;case"f":if(f=e("v"))return f;if("number"!=typeof s.v)return"Not a number: ".concat(s.v," of type ").concat(_typeof(s.v));if(isNaN(s.v))return"OpenMath floats cannot be NaN";if(!isFinite(s.v))return"OpenMath floats must be finite";break;case"st":if(f=e("v"))return f;if("string"!=typeof s.v)return"Value for st type was ".concat(_typeof(s.v),", not string");break;case"ba":if(f=e("v"))return f;if(!(s.v instanceof Uint8Array))return"Value for ba type was not an instance of Uint8Array";break;case"sy":if(f=e("n","cd","uri"))return f;if("string"!=typeof s.n)return"Name for sy type was ".concat(_typeof(s.n),", not string");if("string"!=typeof s.cd)return"CD for sy type was ".concat(_typeof(s.cd),", not string");if(null!=s.uri&&"string"!=typeof s.uri)return"URI for sy type was ".concat(_typeof(s.uri),", not string");if(!r.test(s.n))return"Invalid identifier as symbol name: ".concat(s.n);if(!r.test(s.cd))return"Invalid identifier as symbol CD: ".concat(s.cd);break;case"v":if(f=e("n"))return f;if("string"!=typeof s.n)return"Name for v type was ".concat(_typeof(s.n),", not string");if(!r.test(s.n))return"Invalid identifier as variable name: ".concat(s.n);break;case"a":if(f=e("c"))return f;if(!(s.c instanceof Array))return"Children of application object was not an array";if(0===s.c.length)return"Application object must have at least one child";for(n=0,i=(d=s.c).length;n<i;n++)if(t=d[n],f=this.checkJSON(t))return f;break;case"bi":if(f=e("s","v","b"))return f;if(f=this.checkJSON(s.s))return f;if("sy"!==s.s.t)return"Head of a binding must be a symbol";if(!(s.v instanceof Array))return"In a binding, the v value must be an array";for(a=0,o=(p=s.v).length;a<o;a++){if(g=p[a],f=this.checkJSON(g))return f;if("v"!==g.t)return"In a binding, all values in the v array must have type v"}if(f=this.checkJSON(s.b))return f;break;case"e":if(f=e("s","c"))return f;if(f=this.checkJSON(s.s))return f;if("sy"!==s.s.t)return"Head of an error must be a symbol";if(!(s.c instanceof Array))return"In an error, the c key must be an array";for(l=0,u=(y=s.c).length;l<u;l++)if(t=y[l],f=this.checkJSON(t))return f;break;default:return"Invalid type: ".concat(s.t)}return null}},{key:"decode",value:function(e){var t,p;if("string"==typeof e)try{e=JSON.parse(e)}catch(e){return e.message}return(t=this.checkJSON(e))?t:((p=function(e){var t,r,n,a,i,s,c,o,u,l,f,h,d;for(r=0,i=(o=null!=(c=e.c)?c:[]).length;r<i;r++)(t=o[r]).p=e,p(t);if("bi"===e.t)for(a=0,s=(l=null!=(u=e.v)?u:[]).length;a<s;a++)(d=l[a]).p=e,p(d);for(n in h=null!=(f=e.a)?f:{})hasProp.call(h,n)&&((d=h[n]).p=e,p(d));if(null!=e.s&&(e.s.p=e,p(e.s)),null!=e.b)return e.b.p=e,p(e.b)})(e),e.p=null,new S(e))}}]),_createClass(S,[{key:"encode",value:function(){return JSON.stringify(this.tree,function(e,t){return"p"===e?void 0:t})}},{key:"equals",value:function(e){var o,u=!(1<arguments.length&&void 0!==arguments[1])||arguments[1];return(o=function(e,t){var r,n,a,i,s,c;if(e===t)return!0;if(e instanceof Array||e instanceof Uint8Array){if(e instanceof Array&&!(t instanceof Array))return!1;if(e instanceof Uint8Array&&!(t instanceof Uint8Array))return!1;if(e.length!==t.length)return!1;for(n=a=0,s=e.length;a<s;n=++a)if(r=e[n],!o(r,t[n]))return!1;return!0}if(!(e instanceof Object))return!1;if(!(t instanceof Object))return!1;for(i in e)if(hasProp.call(e,i)&&(c=e[i],"p"!==i&&(u||"a"!==i))){if(!t.hasOwnProperty(i))return"a"===i&&o(c,{});if(!o(c,t[i]))return!1}for(i in t)if(hasProp.call(t,i)&&(c=t[i],"p"!==i&&(u||"a"!==i)&&!e.hasOwnProperty(i)))return"a"===i&&o(c,{});return!0})(this.tree,e.tree)}},{key:"sameObjectAs",value:function(e){return this.tree===(null!=e?e.tree:void 0)}},{key:"copy",value:function(){var o;return S.decode((o=function(a){var i,e,t,r,n,s,c;for(e in n=function(){switch(a.t){case"i":case"f":case"st":return{t:a.t,v:a.v};case"v":return{t:"v",n:a.n};case"sy":return n={t:"sy",n:a.n,cd:a.cd},a.hasOwnProperty("uri")&&(n.uri=a.uri),n;case"ba":return{t:"ba",v:new Uint8Array(a.v)};case"e":case"a":return n={t:a.t,c:function(){var e,t,r,n;for(n=[],e=0,t=(r=a.c).length;e<t;e++)i=r[e],n.push(o(i));return n}()},"e"===a.t&&(n.s=o(a.s)),n;case"bi":return{t:"bi",s:o(a.s),v:function(){var e,t,r,n;for(n=[],e=0,t=(r=a.v).length;e<t;e++)c=r[e],n.push(o(c));return n}(),b:o(a.b)}}}(),r=null!=(t=a.a)?t:{})hasProp.call(r,e)&&(s=r[e],(null!=n.a?n.a:n.a={})[e]=o(s));return n})(this.tree))}},{key:"simpleEncode",value:function(){var c;return(c=function(a){var e,i,t,r,s,n;switch(null!=a?a.t:void 0){case"i":case"f":return"".concat(a.v);case"v":return a.n;case"st":return"'".concat(a.v.replace(/'/g,"\\'"),"'");case"sy":return"".concat(a.cd,".").concat(a.n);case"ba":return"'byte array'";case"e":return"'error'";case"a":return r=(t=function(){var e,t,r,n;for(n=[],e=0,t=(r=a.c).length;e<t;e++)i=r[e],n.push(c(i));return n}()).shift(),"".concat(r,"(").concat(t.join(","),")");case"bi":return n=function(){var e,t,r,n;for(n=[],e=0,t=(r=a.v).length;e<t;e++)s=r[e],n.push(c(s));return n}(),r=c(a.s),e=c(a.b),"".concat(r,"[").concat(n.join(","),",").concat(e,"]");default:return"Error: Invalid OpenMath type ".concat(null!=a?a.t:void 0)}})(this.tree)}},{key:"findInParent",value:function(){var e,t,r,n,a,i,s,c,o,u,l,f,h;if(this.parent){for(t=r=0,i=(c=this.parent.children).length;r<i;t=++r)if(e=c[t],this.sameObjectAs(e))return"c".concat(t);if("v"===this.type)for(t=a=0,s=(o=this.parent.variables).length;a<s;t=++a)if(h=o[t],this.sameObjectAs(h))return"v".concat(t);if(this.sameObjectAs(this.parent.symbol))return"s";if(this.sameObjectAs(this.parent.body))return"b";for(n in l=null!=(u=this.parent.tree.a)?u:{})if(hasProp.call(l,n)&&(f=l[n],this.tree===f))return n}}},{key:"findChild",value:function(e){switch(e[0]){case"c":return this.children[parseInt(e.slice(1))];case"v":return this.variables[parseInt(e.slice(1))];case"s":return this.symbol;case"b":return this.body;case"{":return this.getAttribute(S.decode(e))}}},{key:"address",value:function(e){return!this.parent||this.sameObjectAs(e)?[]:this.parent.address(e).concat([this.findInParent()])}},{key:"index",value:function(e){var t;if(e instanceof Array)return 0===e.length?this:null!=(t=this.findChild(e[0]))?t.index(e.slice(1)):void 0}},{key:"remove",value:function(){var e;if(e=this.findInParent()){switch(e[0]){case"c":this.parent.tree.c.splice(parseInt(e.slice(1)),1);break;case"v":this.parent.tree.v.splice(parseInt(e.slice(1)),1);break;case"b":delete this.parent.tree.b;break;case"s":delete this.parent.tree.s;break;case"{":delete this.parent.tree.a[e]}return delete this.tree.p}}},{key:"replaceWith",value:function(e){var t,r;if(!this.sameObjectAs(e)&&!("s"===(t=this.findInParent())&&"sy"!==e.type||"v"===(null!=t?t[0]:void 0)&&"v"!==e.type)){switch(e.remove(),r=new S(this.tree),this.tree=e.tree,null!=t?t[0]:void 0){case"c":r.parent.tree.c[parseInt(t.slice(1))]=this.tree;break;case"v":r.parent.tree.v[parseInt(t.slice(1))]=this.tree;break;case"b":r.parent.tree.b=this.tree;break;case"s":r.parent.tree.s=this.tree;break;case"{":r.parent.tree.a[t]=this.tree;break;default:return}return this.tree.p=r.tree.p,delete r.tree.p,r}}},{key:"getAttribute",value:function(e){var t,r,n,a,i,s;if(e instanceof S&&"sy"===e.type)for(r in n=RegExp('"n":"'.concat(e.name,'"')),t=RegExp('"cd":"'.concat(e.cd,'"')),i=null!=(a=this.tree.a)?a:{})if(hasProp.call(i,r)&&(s=i[r],n.test(r)&&t.test(r)))return new S(s)}},{key:"removeAttribute",value:function(e){var t,r,n,a,i,s;if(e instanceof S&&"sy"===e.type)for(r in n=RegExp('"n":"'.concat(e.name,'"')),t=RegExp('"cd":"'.concat(e.cd,'"')),i=null!=(a=this.tree.a)?a:{})if(hasProp.call(i,r)&&(s=i[r],n.test(r)&&t.test(r)))return new S(s).remove(),void delete this.tree.a[r]}},{key:"setAttribute",value:function(e,t){var r;if(e instanceof S&&t instanceof S&&"sy"===e.type)return this.removeAttribute(e),t.remove(),(null!=(r=this.tree).a?r.a:r.a={})[e.encode()]=t.tree,t.tree.p=this.tree}},{key:"freeVariables",value:function(){var e,t,r,n,a,i,s,c,o,u,l,f,h,d,p;switch(this.type){case"v":return[this.name];case"a":case"c":for(f=[],r=0,a=(o=this.children).length;r<a;r++)for(n=0,i=(u=o[r].freeVariables()).length;n<i;n++)t=u[n],indexOf.call(f,t)<0&&f.push(t);return f;case"bi":for(e=function(){var e,t,r,n;for(n=[],t=0,e=(r=this.variables).length;t<e;t++)d=r[t],n.push(d.name);return n}.call(this),h=[],c=0,s=(l=this.body.freeVariables()).length;c<s;c++)p=l[c],indexOf.call(e,p)<0&&h.push(p);return h;default:return[]}}},{key:"isFree",value:function(e){var t,r,n,a,i,s,c;for(r=this.freeVariables(),c=this;c;){if("bi"===c.type)for(t=function(){var e,t,r,n;for(n=[],e=0,t=(r=c.variables).length;e<t;e++)i=r[e],n.push(i.name);return n}(),n=0,a=r.length;n<a;n++)if(s=r[n],0<=indexOf.call(t,s))return!1;if(c.sameObjectAs(e))break;c=c.parent}return!0}},{key:"occursFree",value:function(e){var t,r,n,a,i;if(this.equals(e)&&this.isFree())return!0;if(null!=(n=this.symbol)?n.equals(e):void 0)return!0;if(null!=(a=this.body)?a.occursFree(e):void 0)return!0;for(t=0,r=(i=this.children).length;t<r;t++)if(i[t].occursFree(e))return!0;return!1}},{key:"isFreeToReplace",value:function(e,t){var r,n,a;if(this.sameObjectAs(e))return!0;if(null==e.parent)return!0;for(r=e;r.parent;)r=r.parent;return a=new S(e.tree),!!e.replaceWith(this.copy())&&(n=e.isFree(t),e.replaceWith(a),n)}},{key:"replaceFree",value:function(e,t,r){var n,a,i,s,c,o,u,l,f,h,d;if(null==r&&(r=this),this.isFree(r)&&this.equals(e))return d=new S(this.tree),this.replaceWith(t.copy()),void(this.isFree(r)||this.replaceWith(d));for(null!=(o=this.symbol)&&o.replaceFree(e,t,r),null!=(u=this.body)&&u.replaceFree(e,t,r),a=0,s=(l=this.variables).length;a<s;a++)l[a].replaceFree(e,t,r);for(h=[],i=0,c=(f=this.children).length;i<c;i++)n=f[i],h.push(n.replaceFree(e,t,r));return h}},{key:"childrenSatisfying",value:function(){var e,t,r,n,a,i=0<arguments.length&&void 0!==arguments[0]?arguments[0]:function(){return!0};for(t=this.children,null!=this.symbol&&t.push(this.symbol),t=t.concat(this.variables),null!=this.body&&t.push(this.body),a=[],r=0,n=t.length;r<n;r++)i(e=t[r])&&a.push(e);return a}},{key:"descendantsSatisfying",value:function(){var e,t,r,n,a,i=0<arguments.length&&void 0!==arguments[0]?arguments[0]:function(){return!0};for(a=[],i(this)&&a.push(this),t=0,r=(n=this.childrenSatisfying()).length;t<r;t++)e=n[t],a=a.concat(e.descendantsSatisfying(i));return a}},{key:"hasDescendantSatisfying",value:function(){var e,t,r,n=0<arguments.length&&void 0!==arguments[0]?arguments[0]:function(){return!0};if(n(this))return!0;for(e=0,t=(r=this.childrenSatisfying()).length;e<t;e++)if(r[e].hasDescendantSatisfying(n))return!0;return!1}}],[{key:"integer",value:function(e){return S.decode({t:"i",v:e})}},{key:"float",value:function(e){return S.decode({t:"f",v:e})}},{key:"string",value:function(e){return S.decode({t:"st",v:e})}},{key:"bytearray",value:function(e){return S.decode({t:"ba",v:e})}},{key:"symbol",value:function(e,t,r){return S.decode(null!=r?{t:"sy",n:e,cd:t,uri:r}:{t:"sy",n:e,cd:t})}},{key:"variable",value:function(e){return S.decode({t:"v",n:e})}},{key:"application",value:function(){var e,t,r,n;n={t:"a",c:[]};for(var a=arguments.length,i=new Array(a),s=0;s<a;s++)i[s]=arguments[s];for(t=0,r=i.length;t<r;t++)e=i[t],n.c.push(e instanceof S?JSON.parse(e.encode()):e);return S.decode(n)}},{key:"attribution",value:function(e){var t,r;if(!(e instanceof Object))return"Invalid first parameter to attribution";for(var n=arguments.length,a=new Array(1<n?n-1:0),i=1;i<n;i++)a[i-1]=arguments[i];if(a.length%2!=0)return"Incomplete key-value pair in attribution";for(e instanceof S&&(e=JSON.parse(e.encode()));0<a.length;)null==e.a&&(e.a={}),t=(t=a.shift())instanceof S?t.encode():JSON.stringify(t),r=a.shift(),e.a[t]=r instanceof S?JSON.parse(r.encode()):r;return S.decode(e)}},{key:"binding",value:function(e){for(var t,r,n,a,i,s=arguments.length,c=new Array(1<s?s-1:0),o=1;o<s;o++)c[o-1]=arguments[o];if(c=_toArray(c).slice(0),t=_slicedToArray(splice.call(c,-1),1)[0],!(e instanceof Object))return"Invalid first parameter to binding";if(!(t instanceof Object))return"Invalid last parameter to binding";for(a={t:"bi",s:e instanceof S?JSON.parse(e.encode()):e,v:[],b:t instanceof S?JSON.parse(t.encode()):t},r=0,n=c.length;r<n;r++)i=c[r],a.v.push(i instanceof S?JSON.parse(i.encode()):i);return S.decode(a)}},{key:"error",value:function(e){var t,r,n,a;if(!(e instanceof Object))return"Invalid first parameter to binding";a={t:"e",s:e instanceof S?JSON.parse(e.encode()):e,c:[]};for(var i=arguments.length,s=new Array(1<i?i-1:0),c=1;c<i;c++)s[c-1]=arguments[c];for(t=0,r=s.length;t<r;t++)n=s[t],a.c.push(n instanceof S?JSON.parse(n.encode()):n);return S.decode(a)}},{key:"simpleDecode",value:function(e){var t,r,n,a,i,s,c,o,u,l,f,h,d,p,y,b,v,g,m,O,k,M,A,w;if("string"!=typeof e)return"Input was not a string";for(A=[];0<e.length;){for(b=e.length,s=0,o=x.length;s<o;s++)null!=(h=(M=x[s]).pattern.exec(e))&&0===h.index&&(A.push({type:M.name,text:h[0]}),e=e.slice(h[0].length));if(e.length===b)return"Could not understand from here: ".concat(e.slice(0,11))}for(k="expression about to start",O=[];0<A.length;){switch(p=A.shift(),k){case"expression about to start":switch(p.type){case"symbol":n=p.text.split("."),O.unshift({node:S.symbol(n[1],n[0])});break;case"variable":O.unshift({node:S.variable(p.text)});break;case"integer":i=parseInt(p.text),/\./.test(i)&&(i=p.text),O.unshift({node:S.integer(i)});break;case"float":O.unshift({node:S.float(parseFloat(p.text))});break;case"string":w=p.text[0],p=p.text.slice(1,-1).replace(RegExp("\\\\".concat(w),"g"),w),O.unshift({node:S.string(p)});break;default:return"Unexpected ".concat(p.text)}k="expression ended";break;case"expression ended":switch(p.type){case"comma":k="expression about to start";break;case"openParen":O[0].head="application",k="closeParen"===(null!=A&&null!=(v=A[0])?v.type:void 0)?(A.shift(),O.unshift({node:S.application(O.shift().node)}),"expression ended"):"expression about to start";break;case"openBracket":O[0].head="binding",k="expression about to start";break;case"closeParen":for(a=c=0,u=O.length;c<u&&"application"!==(r=O[a]).head;a=++c)if("binding"===r.head)return"Mismatch: [ closed by )";if(a===O.length)return"Unexpected )";for(t=[],f=0,g=a;0<=g?f<=g:g<=f;0<=g?++f:--f)t.unshift(O.shift().node);O.unshift({node:S.application.apply(null,t)});break;case"closeBracket":for(a=d=0,l=O.length;d<l&&"binding"!==(r=O[a]).head;a=++d)if("application"===r.head)return"Mismatch: ( closed by ]";if(a===O.length)return"Unexpected ]";for(t=[],y=0,m=a;0<=m?y<=m:m<=y;0<=m?++y:--y)t.unshift(O.shift().node);O.unshift({node:S.binding.apply(null,t)});break;default:return"Unexpected ".concat(p.text)}}if("string"==typeof(null!=O?O[0].node:void 0))return O[0].node}return 1<O.length?"Unexpected end of input":O[0].node}}]),S}();return x=[{name:"symbol",pattern:/[:A-Za-z_][:A-Za-z_0-9-]*\.[:A-Za-z_][:A-Za-z_0-9-]*/},{name:"variable",pattern:/[:A-Za-z_][:A-Za-z_0-9-]*/},{name:"float",pattern:/[+-]?(?:[0-9]+\.[0-9]*|[0-9]*\.[0-9]+)/},{name:"integer",pattern:/[+-]?[0-9]+/},{name:"string",pattern:/"(?:[^"\\]|\\"|\\\\)*"|'(?:[^'\\]|\\'|\\\\)*'/},{name:"comma",pattern:/,/},{name:"openParen",pattern:/\(/},{name:"closeParen",pattern:/\)/},{name:"openBracket",pattern:/\[/},{name:"closeBracket",pattern:/\]/}],e}.call(void 0)).int=OM.integer,OM.flo=OM.float,OM.str=OM.string,OM.byt=OM.bytearray,OM.sym=OM.symbol,OM.var=OM.variable,OM.app=OM.application,OM.att=OM.attribution,OM.bin=OM.binding,OM.err=OM.error,OM.simple=OM.simpleDecode,OM.encodeAsIdentifier=function(t){var e,r,n,a,i;for(e=function(e){return("000"+t.charCodeAt(e).toString(16)).slice(-4)},i="id_",r=n=0,a=t.length;0<=a?n<a:a<n;r=0<=a?++n:--n)i+=e(r);return i},OM.decodeIdentifier=function(e){var t;if(t="","id_"!==e.slice(0,3))return t;for(e=e.slice(3);0<e.length;)t+=String.fromCharCode(parseInt(e.slice(0,4),16)),e=e.slice(4);return t},OM.prototype.toXML=function(){var e,a,t,i,r,n,s,c;switch(i=function(e){return"  ".concat(e.replace(RegExp("\n","g"),"\n  "))},this.type){case"i":return"<OMI>".concat(this.value,"</OMI>");case"sy":return'<OMS cd="'.concat(this.cd,'" name="').concat(this.name,'"/>');case"v":return'<OMV name="'.concat(this.name,'"/>');case"f":return'<OMF dec="'.concat(this.value,'"/>');case"st":return n=this.value.replace(/\&/g,"&amp;").replace(/</g,"&lt;"),"<OMSTR>".concat(n,"</OMSTR>");case"a":return r=function(){var e,t,r,n;for(n=[],e=0,t=(r=this.children).length;e<t;e++)a=r[e],n.push(i(a.toXML()));return n}.call(this).join("\n"),"<OMA>\n".concat(r,"\n</OMA>");case"bi":return t=i(this.symbol.toXML()),c=function(){var e,t,r,n;for(n=[],e=0,t=(r=this.variables).length;e<t;e++)s=r[e],n.push(s.toXML());return n}.call(this).join(""),c=i("<OMBVAR>".concat(c,"</OMBVAR>")),e=i(this.body.toXML()),"<OMBIND>\n".concat(t,"\n").concat(c,"\n").concat(e,"\n</OMBIND>");default:throw"Cannot convert this to XML: ".concat(this.simpleEncode())}},OM.prototype.evaluate=function(){var e,a,t,f=this;return e=function(e){var t,r,n,a,i,s,c;s=void 0,r=[];for(var o=arguments.length,u=new Array(1<o?o-1:0),l=1;l<o;l++)u[l-1]=arguments[l];for(a=0,i=u.length;a<i;a++){if(n=u[a],null==(t=f.children[n].evaluate()).value)return t;null!=t.message&&(null==s?s="":s+="\n",s+=t.message),r.push(t.value)}try{c=e.apply(void 0,_toConsumableArray(r))}catch(e){null==s?s="":s+="\n",s+=e.message}return{value:c,message:s}},null==(a=function(){switch(this.type){case"i":case"f":return{value:new Number(this.value)};case"st":case"ba":return{value:this.value};case"v":switch(this.name){case"π":return{value:Math.PI,message:"The actual value of π has been rounded."};case"e":return{value:Math.exp(1),message:"The actual value of e has been rounded."}}break;case"sy":switch(this.simpleEncode()){case"units.degrees":return{value:Math.PI/180,message:"Converting to degrees used an approximation of π."};case"units.percent":return{value:.01};case"units.dollars":return{value:1,message:"Dollar units were dropped"}}break;case"a":switch(this.children[0].simpleEncode()){case"arith1.plus":return e(function(e,t){return e+t},1,2);case"arith1.minus":return e(function(e,t){return e-t},1,2);case"arith1.times":return e(function(e,t){return e*t},1,2);case"arith1.divide":return e(function(e,t){return e/t},1,2);case"arith1.power":return e(Math.pow,1,2);case"arith1.root":return e(function(e,t){return Math.pow(t,1/e)},1,2);case"arith1.abs":return e(Math.abs,1);case"arith1.unary_minus":return e(function(e){return-e},1);case"relation1.eq":return e(function(e,t){return e===t},1,2);case"relation1.approx":return(null!=(t=e(function(e,t){return Math.abs(e-t)<.01},1,2)).message?t.message:t.message="").length&&(t.message+="\n"),t.message+="Values were rounded to two decimal places for approximate comparison.",t;case"relation1.neq":return e(function(e,t){return e!==t},1,2);case"relation1.lt":return e(function(e,t){return e<t},1,2);case"relation1.gt":return e(function(e,t){return t<e},1,2);case"relation1.le":return e(function(e,t){return e<=t},1,2);case"relation1.ge":return e(function(e,t){return t<=e},1,2);case"logic1.not":return e(function(e){return!e},1);case"transc1.sin":return e(Math.sin,1);case"transc1.cos":return e(Math.cos,1);case"transc1.tan":return e(Math.tan,1);case"transc1.cot":return e(function(e){return 1/Math.tan(e)},1);case"transc1.sec":return e(function(e){return 1/Math.cos(e)},1);case"transc1.csc":return e(function(e){return 1/Math.sin(e)},1);case"transc1.arcsin":return e(Math.asin,1);case"transc1.arccos":return e(Math.acos,1);case"transc1.arctan":return e(Math.atan,1);case"transc1.arccot":return e(function(e){return Math.atan(1/e)},1);case"transc1.arcsec":return e(function(e){return Math.acos(1/e)},1);case"transc1.arccsc":return e(function(e){return Math.asin(1/e)},1);case"transc1.ln":return e(Math.log,1);case"transc1.log":return e(function(e,t){return Math.log(t)/Math.log(e)},1,2);case"integer1.factorial":return e(function(e){var t,r,n;if(e<=1)return 1;if(20<=e)return Infinity;for(t=r=a=1,n=0|e;1<=n?r<=n:n<=r;t=1<=n?++r:--r)a*=t;return a},1)}}}.call(this))&&(a={value:void 0}),void 0===a.value&&(a.message="Could not evaluate ".concat(this.simpleEncode())),a},null!=(scope=null!=(ref="undefined"!=typeof exports&&null!==exports?exports:self)?ref:WorkerGlobalScope)&&(scope.OMNode=scope.OM=OM);