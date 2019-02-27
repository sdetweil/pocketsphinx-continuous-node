'use strict';

var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var reservedEvents = {
  close: true,
  error: true,
  data: true,
  end: true,
  readable: true,
  drain: true,
  finish: true,
  pipe: true,
  unpipe: true
};

var PocketSphinxContinuous = function(config)  {

  this.setId = config.setId;
  this.verbose = config.verbose;
  this.microphone = config.microphone;
  this.autostart = config.autostart;

  if(config.autostart == undefined || config.autostart==true)
  {
    this.startListening()
  } 
  EventEmitter.call(this); 
}

PocketSphinxContinuous.prototype = function(){
  var psc = null,
      pc = null,
  
  startListening = function(){  
    if(pc==null){
      pc = spawn('pocketsphinx_continuous', [
        '-adcdev',
        'plughw:' + this.microphone,
        '-inmic',
        'yes',
        '-lm',
        'modules/MMM-voice/' + this.setId + '.lm',
        '-dict',
        'modules/MMM-voice/' + this.setId + '.dic'
      ]);
      psc = this;
      pc.stdout.on('data', function(data) {
        var output = data.toString().trim();
        if (output) {
          psc.emit('data', output);
        }
        // Also try to emit an event for the actual data, unless of course the
        // event is a reserved one.
        var eventName = output.toLowerCase();
        if (!reservedEvents[eventName]) {
          psc.emit(eventName, output)
        }
      });
      pc.stderr.on('data', function(data) {
        var output = data.toString().trim();
        if (config.verbose && output) {
          psc.emit('debug', data);
        }
      });
      pc.on('close', function(code) {
        psc.emit('error', code);
      });
      pc.on('error', function(err) {
        psc.emit('error', err);
      })
    }
  },

  stopListening = function (){
      if(pc!=null){
        pc.kill();
        pc=null;
      }
  },

   getStatus = function(){
      return pc!=null;  
  };
  return {startListening: startListening,
          stopListening: stopListening,
          isListening: getStatus
         };

} ();
util.inherits(PocketSphinxContinuous , EventEmitter);

module.exports = PocketSphinxContinuous;
