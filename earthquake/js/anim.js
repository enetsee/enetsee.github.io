function timelineAnim (startDate,endDate,step,timeout,charts,renderAll) {
  var anim = {};
  var timer;
  var t0,t1;
  var stExtent = [null,[6.5,9.2],[0,100],[new Date(2005, 1, 1), new Date(2015, 1, 1)] ];
  var state = 0;
  function _play() {
    // if stopped...
    if(state===0) {
      state = 1; // set to playing
      t0 = startDate; // determine initial timeline extent
      t1 = step(t0);
      // set animation extents
      var ex= [null,[6.5,9.5],[0,100],[t0,t1]];
      ex.forEach(function (d,i) { charts[i].filter(d); });
      renderAll();
      timer = setInterval(_next,timeout);
    } else if(state===2) {
      state = 1;
      timer = setInterval(_next,timeout);
    }
  }
  function _pause() {
    if(state===1) {
      state = 2;
      clearInterval(timer);
      timer = null;
    }
  }
  function _stop() {
    if(state>0) {
      state = 0;
      if(timer) {
        clearInterval(timer);
        timer = null;
      }
      stExtent.forEach(function (d,i) {
        charts[i].filter(d);
      });
      renderAll();
    }
  }
  function _next() {
    t0 = t1;
    t1 = step(t1);
    if ( t0 > endDate) {
      t0 = startDate; // determine initial timeline extent
      t1 = step(t0);
    }

    var ex= [null,[6.5,9.5],[0,200],[t0,t1]];
    ex.forEach(function (d,i) { charts[i].filter(d); });
    renderAll();
    
  }
  anim.play = function () {
    _play();
    return anim;
  };
  anim.pause = function() {
    _pause();
    return anim;
  };
  anim.stop = function() {
    _stop();
    return anim;
  };
  anim.playing = function () {
    return (state === 1);
  };
  anim.stopped = function () {
    return (state === 0);
  };
  anim.paused = function () {
    return (state === 2);
  };
  return anim;
}