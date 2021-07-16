var Structure, slice = [].slice,
  indexOf = [].indexOf || function(t) {
    for (var n = 0, e = this.length; n < e; n++)
      if (n in this && this[n] === t) return n;
    return -1
  },
  hasProp = {}.hasOwnProperty;
Structure = function() {
  function t() {
    var t, n, e, i;
    for (n = 1 <= arguments.length ? slice.call(arguments, 0) : [], this.attributes = {}, this.parentNode = null, this.childList = [], e = 0, i = n.length; e < i; e++) t = n[e], this.insertChild(t, this.childList.length);
    this.dirty = !1
  }
  var n, e;
  return t.prototype.isDirty = function() {
    return this.dirty
  }, t.prototype.subclasses = {}, t.addSubclass = function(n, e) {
    return t.prototype.subclasses[n] = e, n
  }, t.prototype.className = t.addSubclass("Structure", t), t.prototype.toJSON = function(t) {
    var n, e;
    return null == t && (t = !0), t || null == this.id() ? n = this.attributes : delete(n = JSON.parse(JSON.stringify(this.attributes))).id, {
      className: this.className,
      attributes: n,
      children: function() {
        var n, i, o, r;
        for (r = [], n = 0, i = (o = this.childList).length; n < i; n++) e = o[n], r.push(e.toJSON(t));
        return r
      }.call(this)
    }
  }, t.prototype.equals = function(t) {
    var n;
    return (n = function(t) {
      var n;
      return n = [], JSON.stringify(t, function(t, e) {
        return n.push(t), e
      }), JSON.stringify(t, n.sort())
    })(this.toJSON()) === n(t.toJSON())
  }, t.fromJSON = function(n) {
    var e, i, o, r;
    return o = t.prototype.subclasses[n.className], i = function() {
      var i, o, r, s;
      for (s = [], i = 0, o = (r = n.children).length; i < o; i++) e = r[i], s.push(t.fromJSON(e));
      return s
    }(), r = function(t, n, e) {
      e.prototype = t.prototype;
      var i = new e,
        o = t.apply(i, n);
      return Object(o) === o ? o : i
    }(o, i, function() {}), r.attributes = JSON.parse(JSON.stringify(n.attributes)), r
  }, t.prototype.parent = function() {
    return this.parentNode
  }, t.prototype.children = function() {
    return this.childList.slice(0)
  }, t.prototype.indexInParent = function() {
    var t, n;
    return null != (t = this.parentNode) && null != (n = t.childList) ? n.indexOf(this) : void 0
  }, t.prototype.previousSibling = function() {
    var t;
    if (null != (t = this.indexInParent())) return this.parentNode.childList[t - 1]
  }, t.prototype.nextSibling = function() {
    var t;
    if (null != (t = this.indexInParent())) return this.parentNode.childList[t + 1]
  }, t.prototype.copy = function() {
    var n, e, i, o, r;
    for ((e = new(0, t.prototype.subclasses[this.className])).attributes = JSON.parse(JSON.stringify(this.attributes)), e.childList = function() {
        var t, e, i, o;
        for (o = [], t = 0, e = (i = this.childList).length; t < e; t++) n = i[t], o.push(n.copy());
        return o
      }.call(this), i = 0, o = (r = e.childList).length; i < o; i++) r[i].parentNode = e;
    return e
  }, t.prototype.isEarlierThan = function(n) {
    var e, i, o, r, s, c, u, l;
    if (n instanceof t) {
      if (n === this) return !1;
      for (e = [n]; null != (r = e[0].parent());) e.unshift(r);
      for (l = this, u = null; null != l && indexOf.call(e, l) < 0;) u = l, l = l.parent();
      if (null != l) return l === this || l !== n && (i = e.indexOf(l), c = e[i + 1], o = u.indexInParent(), s = c.indexInParent(), o < s)
    }
  }, t.prototype.removeFromParent = function() {
    var t, n;
    if (null != (n = this.parentNode)) return "function" == typeof this.willBeRemoved && this.willBeRemoved(), t = this.indexInParent(), this.parentNode.childList.splice(t, 1), this.parentNode = null, "function" == typeof this.wasRemoved ? this.wasRemoved(n, t) : void 0
  }, t.prototype.removeChild = function(t) {
    var n;
    return null != (n = this.childList[t]) ? n.removeFromParent() : void 0
  }, t.prototype.insertChild = function(n, e) {
    var i;
    if (null == e && (e = 0), n instanceof t && n !== this && 0 <= e && e <= this.childList.length) {
      for (i = this; null != (i = i.parent());)
        if (i === n) {
          this.removeFromParent();
          break
        } return n.removeFromParent(), "function" == typeof n.willBeInserted && n.willBeInserted(this, e), this.childList.splice(e, 0, n), n.parentNode = this, "function" == typeof n.wasInserted ? n.wasInserted() : void 0
    }
  }, t.prototype.replaceWith = function(t) {
    var n, e;
    if (null != (e = this.parentNode)) return n = this.indexInParent(), this.removeFromParent(), e.insertChild(t, n)
  }, t.prototype.getAttribute = function(t) {
    return this.attributes[t]
  }, t.prototype.setAttribute = function(t, n) {
    if (this.attributes[t] !== n) return "function" == typeof this.willBeChanged && this.willBeChanged(t), this.attributes[t] = n, "function" == typeof this.wasChanged ? this.wasChanged(t) : void 0
  }, t.prototype.clearAttributes = function() {
    var t, n, e, i, o;
    for (0 === (e = 1 <= arguments.length ? slice.call(arguments, 0) : []).length && (e = Object.keys(this.attributes)), o = [], t = 0, i = e.length; t < i; t++)(n = e[t]) in this.attributes ? ("function" == typeof this.willBeChanged && this.willBeChanged(n), delete this.attributes[n], o.push("function" == typeof this.wasChanged ? this.wasChanged(n) : void 0)) : o.push(void 0);
    return o
  }, t.prototype.attr = function(t) {
    var n, e;
    for (n in t) hasProp.call(t, n) && (e = t[n], this.setAttribute(n, e));
    return this
  }, t.prototype.IDs = {}, t.instanceWithID = function(n) {
    return t.prototype.IDs[n]
  }, t.prototype.id = function() {
    return this.getAttribute("id")
  }, t.prototype.trackIDs = function(n) {
    var e, i, o, r, s;
    if (null == n && (n = !0), this.noticeAllConnections(), null != this.id() && (t.prototype.IDs[this.id()] = this), n) {
      for (s = [], i = 0, o = (r = this.children()).length; i < o; i++) e = r[i], s.push(e.trackIDs());
      return s
    }
  }, t.prototype.untrackIDs = function(n) {
    var e, i, o, r, s;
    if (null == n && (n = !0), this.removeAllConnections(), null != this.id() && delete t.prototype.IDs[this.id()], n) {
      for (s = [], i = 0, o = (r = this.children()).length; i < o; i++) e = r[i], s.push(e.untrackIDs());
      return s
    }
  }, t.prototype.idIsTracked = function() {
    return null != this.id() && this === t.instanceWithID(this.id())
  }, t.prototype.clearIDs = function(t) {
    var n, e, i, o, r;
    if (null == t && (t = !0), this.removeAllConnections(), this.clearAttributes("id"), t) {
      for (r = [], e = 0, i = (o = this.children()).length; e < i; e++) n = o[e], r.push(n.clearIDs());
      return r
    }
  }, t.prototype.changeID = function(n) {
    var e, i, o, r, s, c, u, l;
    if (null != t.instanceWithID(n) || this !== t.instanceWithID(this.id())) return !1;
    for (e = 0, o = (r = this.getAllConnections()).length; e < o; e++) i = r[e], (l = this.getAttribute("_conn " + i + " to")) && (u = t.instanceWithID(l)) && u.setAttribute("_conn " + i + " from", n), (c = this.getAttribute("_conn " + i + " from")) && (s = t.instanceWithID(c)) && s.setAttribute("_conn " + i + " to", n);
    return t.prototype.IDs[n] = this, delete t.prototype.IDs[this.id()], this.setAttribute("id", n)
  }, t.prototype.connectionIDs = {}, t.sourceOfConnection = function(n) {
    return t.prototype.connectionIDs[n]
  }, t.connect = function(n, e, i) {
    return !!(i instanceof Object && i.hasOwnProperty("id") && !t.prototype.connectionIDs.hasOwnProperty(i.id) && n instanceof t && e instanceof t && n.idIsTracked() && e.idIsTracked()) && ("function" == typeof n.connectionWillBeInserted && n.connectionWillBeInserted(n, e, i), "function" == typeof e.connectionWillBeInserted && e.connectionWillBeInserted(n, e, i), "function" == typeof n.addConnectionOrigin && n.addConnectionOrigin(n, e, i), n.setAttribute("_conn " + i.id + " data", i), n.setAttribute("_conn " + i.id + " to", e.id()), e.setAttribute("_conn " + i.id + " from", n.id()), t.prototype.connectionIDs[i.id] = n, "function" == typeof n.connectionWasInserted && n.connectionWasInserted(n, e, i), "function" == typeof e.connectionWasInserted && e.connectionWasInserted(n, e, i), !0)
  }, t.prototype.connectTo = function(n, e) {
    return t.connect(this, n, e)
  }, t.getConnectionSource = function(n) {
    return t.sourceOfConnection(n)
  }, t.getConnectionTarget = function(n) {
    var e, i;
    if ((e = t.sourceOfConnection(n)) && (i = e.getAttribute("_conn " + n + " to"))) return t.instanceWithID(i)
  }, t.getConnectionData = function(n) {
    var e;
    if (e = t.sourceOfConnection(n)) return e.getAttribute("_conn " + n + " data")
  }, t.prototype.getConnectionSource = function(n) {
    return t.getConnectionSource(n)
  }, t.prototype.getConnectionTarget = function(n) {
    return t.getConnectionTarget(n)
  }, t.prototype.getConnectionData = function(n) {
    return t.getConnectionData(n)
  }, t.prototype.getConnectionsIn = function() {
    var t, n, e;
    e = [], n = this.attributes;
    for (t in n) hasProp.call(n, t) && "_conn " === t.slice(0, 6) && " from" === t.slice(-5) && e.push(t.slice(6, -5));
    return e.sort(), e
  }, t.prototype.getConnectionsOut = function() {
    var t, n, e;
    e = [], n = this.attributes;
    for (t in n) hasProp.call(n, t) && "_conn " === t.slice(0, 6) && " to" === t.slice(-3) && e.push(t.slice(6, -3));
    return e.sort(), e
  }, t.prototype.getAllConnections = function() {
    var t, n, e, i, o;
    for (o = this.getConnectionsIn(), t = 0, n = (i = this.getConnectionsOut()).length; t < n; t++) e = i[t], indexOf.call(o, e) < 0 && o.push(e);
    return o.sort(), o
  }, t.disconnect = function(n) {
    var e, i, o;
    return !!((e = t.prototype.connectionIDs[n]) && (o = e.getAttribute("_conn " + n + " to")) && (i = t.instanceWithID(o)) && e.getAttribute("_conn " + n + " data")) && ("function" == typeof e.connectionWillBeRemoved && e.connectionWillBeRemoved(n), "function" == typeof i.connectionWillBeRemoved && i.connectionWillBeRemoved(n), e.clearAttributes("_conn " + n + " data", "_conn " + n + " to"), i.clearAttributes("_conn " + n + " from"), delete t.prototype.connectionIDs[n], "function" == typeof e.connectionWasRemoved && e.connectionWasRemoved(n), "function" == typeof i.connectionWasRemoved && i.connectionWasRemoved(n), !0)
  }, t.prototype.disconnect = function(n) {
    return t.disconnect(n)
  }, t.setConnectionData = function(n, e, i) {
    var o, r, s, c;
    return !!("id" !== e && (r = t.prototype.connectionIDs[n]) && (c = r.getAttribute("_conn " + n + " to")) && (s = t.instanceWithID(c)) && (o = r.getAttribute("_conn " + n + " data"))) && ("function" == typeof r.connectionWillBeChanged && r.connectionWillBeChanged(n), "function" == typeof s.connectionWillBeChanged && s.connectionWillBeChanged(n), void 0 === i ? delete o[e] : o[e] = i, "function" == typeof r.connectionWasChanged && r.connectionWasChanged(n), "function" == typeof s.connectionWasChanged && s.connectionWasChanged(n), !0)
  }, t.prototype.setConnectionData = function(n, e, i) {
    return t.setConnectionData(n, e, i)
  }, t.prototype.removeAllConnections = function() {
    var n, e, i, o, r, s, c, u, l;
    for (e = 0, r = (c = this.getAllConnections()).length; e < r; e++) i = c[e], t.disconnect(i);
    for (l = [], o = 0, s = (u = this.children()).length; o < s; o++) n = u[o], l.push(n.removeAllConnections());
    return l
  }, t.prototype.noticeAllConnections = function() {
    var n, e, i, o, r, s, c, u;
    for (u = !0, n = 0, o = (s = this.getConnectionsOut()).length; n < o; n++) e = s[n], t.prototype.connectionIDs.hasOwnProperty(e) ? u = !1 : t.prototype.connectionIDs[e] = this;
    for (i = 0, r = (c = this.children).length; i < r; i++) c[i].noticeAllConnections() || (u = !1);
    return u
  }, t.prototype.transferConnectionsTo = function(n) {
    var e, i, o, r, s, c, u, l, a;
    if (null == n.id()) return !1;
    for (i = 0, r = (s = this.getAllConnections()).length; i < r; i++) o = s[i], (a = this.getAttribute("_conn " + o + " to")) && (l = t.instanceWithID(a)) && (this.clearAttributes("_conn " + o + " to"), n.setAttribute("_conn " + o + " to", a), l.setAttribute("_conn " + o + " from", n.id()), e = this.getAttribute("_conn " + o + " data"), this.clearAttributes("_conn " + o + " data"), n.setAttribute("_conn " + o + " data", e), t.prototype.connectionIDs[o] = n), (u = this.getAttribute("_conn " + o + " from")) && (c = t.instanceWithID(u)) && (this.clearAttributes("_conn " + o + " from"), n.setAttribute("_conn " + o + " from", u), c.setAttribute("_conn " + o + " to", n.id()));
    return !0
  }, t.prototype.isAccessibleTo = function(n) {
    return n instanceof t && (null != n.parent() && (this.parent() === n.parent() ? this.indexInParent() < n.indexInParent() : this.isAccessibleTo(n.parent())))
  }, t.prototype.isInTheScopeOf = function(t) {
    return t.isAccessibleTo(this)
  }, t.prototype.iteratorOverAccessibles = function() {
    return {
      ancestor: this,
      sibling: this,
      next: function() {
        return null == this.ancestor ? null : null != (this.sibling = this.sibling.previousSibling()) ? this.sibling : (this.sibling = this.ancestor = this.ancestor.parent(), this.next())
      }
    }
  }, t.prototype.iteratorOverScope = function() {
    return {
      chain: [this],
      next: function() {
        var t, n;
        if (0 === this.chain.length) return null;
        if (t = this.chain.pop(), null != (n = t.nextSibling())) {
          for (this.chain.push(n); null != (n = n.children()[0]);) this.chain.push(n);
          return this.chain[this.chain.length - 1]
        }
        return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null
      }
    }
  }, e = function(t, n) {
    var e;
    for (null == n && (n = function() {
        return !0
      }); null != (e = t.next());)
      if (n(e)) return e
  }, n = function(t, n) {
    var e, i;
    for (null == n && (n = function() {
        return !0
      }), i = []; null != (e = t.next());) n(e) && i.push(e);
    return i
  }, t.prototype.firstAccessible = function(t) {
    return null == t && (t = function() {
      return !0
    }), e(this.iteratorOverAccessibles(), t)
  }, t.prototype.allAccessibles = function(t) {
    return null == t && (t = function() {
      return !0
    }), n(this.iteratorOverAccessibles(), t)
  }, t.prototype.firstInScope = function(t) {
    return null == t && (t = function() {
      return !0
    }), e(this.iteratorOverScope(), t)
  }, t.prototype.allInScope = function(t) {
    return null == t && (t = function() {
      return !0
    }), n(this.iteratorOverScope(), t)
  }, t.feedback = function(t) {
    return console.log("Structure class feedback not implemented:", t)
  }, t
}(), "undefined" != typeof exports && null !== exports && (exports.Structure = Structure);
//# sourceMappingURL=structure.js.map
