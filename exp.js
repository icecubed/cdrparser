process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var request   = require('superagent');
var fs        = require('fs');
var parse     = require('csv-parse');
var stringify = require('csv-stringify');
var transform = require('stream-transform');
var util      = require('util');
var xml2js    = require('xml2js');

var output      = [];
var parser      = parse({'columns':true});
var input       = fs.createReadStream('./input/uuid.csv');
var output      = fs.createWriteStream('./output/uuid.csv');
var stringifier = stringify({ header: true });
//var v1APIBase   = 'https://beta.deltamktgresearch.com/api/cdr?uuid=';
var v1APIBase   = 'https://voicereach365.com/api/cdr?uuid=';
var fileLocation = {
  prefix: '/usr/local/share/freeswitch/logs/xml_cdr/',
  postfix: '.cdr.xml'
};

function writeLog(logs, isError){
  logs.push('');
  logs.push('--------------------------------------------------');
  logs.push('');
  if(isError){
    console.error(logs.join('\n'));
    return;
  }
  console.log(logs.join('\n'));
}

var transformer = transform(function(record, callback){

  var log = [];

  log.push('Processing : ' + record.uuid);
  var location = fileLocation.prefix + record.uuid + fileLocation.postfix;

  record.status      = '';
  record.exception   = '';
  record.statusCode  = '';
  record.responseTxt = '';

  log.push('reading file  : ' + location);

  fs.readFile(location, 'utf-8', function(err, xml) {
    if (err) {
      record.status = 'file-read-error';
      record.exception = util.inspect(err, {depth: 4});
      callback(null, record);
      log.push(util.inspect(record, {depth: 4, colors: true}));
      writeLog(log, true);
      return;
    }

    var xmlParser = new xml2js.Parser();
    xmlParser.parseString(xml, function (err, result) {
      if (err) {
        record.status = 'xml-file-parse-error';
        record.exception = util.inspect(err, {depth: 4});
        callback(null, record);
        log.push(util.inspect(record, {depth: 4, colors: true}));
        writeLog(log, true);
        return;
      }

      if(result.cdr){
        if(result.cdr.variables && result.cdr.variables.length){
          if(!result.cdr.variables[0].ls_con_ref && !result.cdr.variables[0].sip_h_pro_username){
            log.push('finding producer UUID');
            var producerUUID = result.cdr.variables[0].originator[0];
            log.push('found producerUUID: ' + producerUUID);
            location = fileLocation.prefix + producerUUID + fileLocation.postfix;
            fs.readFile(location, 'utf-8', function(err, producerXml) {
              if (err) {
                record.status = 'file-read-error';
                record.exception = util.inspect(err, {depth: 4});
                callback(null, record);
                log.push(util.inspect(record, {depth: 4, colors: true}));
                writeLog(log, true);
                return;
              }

              log.push('reading complete, sending file to V1 api @ ' + v1APIBase + producerUUID);
              writeLog(log);
              request
                .post(v1APIBase + producerUUID)
                .type('form')
                .send({
                  cdr: producerXml
                })
                .end(function(err, response) {
                  if (err) {
                    record.status = 'post-request-error';
                    record.exception = util.inspect(err, {depth: 4});
                    callback(null, record);
                    log.push(util.inspect(record, {depth: 4, colors: true}));
                    writeLog(log, true);
                    return;
                  }

                  log.push('server response received: ' + record.uuid);
                  record.status      = 'success';
                  record.statusCode  = response.statusCode;
                  record.responseTxt = response.text;
                  callback(null, record);
                  log.push(util.inspect(record, {depth: 4, colors: true}));
                  writeLog(log, false);
                  return;
                });
            });
          } else {
            log.push('reading complete, sending file to V1 api @ ' + v1APIBase + record.uuid);
            writeLog(log);
            request
              .post(v1APIBase + record.uuid)
              .type('form')
              .send({
                cdr: xml
              })
              .end(function(err, response) {
                if (err) {
                  record.status = 'post-request-error';
                  record.exception = util.inspect(err, {depth: 4});
                  callback(null, record);
                  log.push(util.inspect(record, {depth: 4, colors: true}));
                  writeLog(log, true);
                  return;
                }

                log.push('server response received: ' + record.uuid);
                record.status      = 'success';
                record.statusCode  = response.statusCode;
                record.responseTxt = response.text;
                callback(null, record);
                log.push(util.inspect(record, {depth: 4, colors: true}));
                writeLog(log, false);
                return;
              });
          }
        }
      }
    });
  });
}/*, {parallel: 10}*/);

input
  .pipe(parser) // read and parse the input file as a csv
  .pipe(transformer) // for each record run the trasformer to send data to server
  .pipe(stringifier) // change response from trasformer to csv
  .pipe(output); // write output to file
