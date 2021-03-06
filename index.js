var Dom = require('xmldom').DOMParser,
    xpath = require('xpath'),
    through2 = require('through2'),
    _map = require('lodash.map'),
    _reduce = require('lodash.reduce');

module.exports = main;

function getValue(xp,doc,ns){
  var ret;

  if(ns==null){
    ret =  _map(xpath.select(xp,doc),function(n){
      // text
      if(n.data!==undefined){
        return n.toString()
      }
      // attribute
      else if(n.value!==undefined){
        return n.value
      }
      else{
        return n
      }
    });
  }else{
    var select = xpath.useNamespaces(ns);
    ret =  _map(select(xp,doc),function(n){
      // text
      if(n.data!==undefined){
        return n.toString()
      }
      // attribute
      else if(n.value!==undefined){
        return n.value
      }
      else{
        return n
      }
    });
  }

  if(ret.length===0){
    return undefined
  }
  else if(ret.length===1){
    return ret[0]
  }else{
    return ret
  }

};

function recur(p,doc,ns){
  return _reduce(p,function(m,v,k){
    if(typeof v === 'string'){
      m[k] = getValue(v,doc,ns);
    }else{
      m[k] = recur(v,doc,ns);
    }
    return m
  },{});
};

function main(){
  var args = [].slice.call(arguments);
  var p1 = args[0];
  var p2 = args[1] || null;
  var p3 = args[2] || null; // namespace
  var buf = new Buffer('');

  return through2.obj(function(c,e,next){
    buf += c;
    next();
  },function(n){
    var result;
    var xml = buf;

    try{
      var doc = new Dom().parseFromString(xml);

      if(p2===null){
        result = getValue(p1,doc,p3);
      }
      else{
        result = _map(getValue(p1,doc,p3),function(o){
          return recur(p2,o,p3);
        });
      }
      this.push(result);
    }
    catch(e){
      this.emit('error',e);
    }

    n();
  });

};
