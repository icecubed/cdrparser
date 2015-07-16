process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var request = require('superagent');
var fs      = require('fs');

fs.readFile('/home/joel/xml_cdr/714dc2ef-2690-4492-a04f-43427cd78e75.cdr.xml', 'utf-8', function(err, xml) {
  if (err) throw err;
  console.log(xml);
  request
    .post('https://ls.com/api/cdr?uuid=714dc2ef-2690-4492-a04f-43427cd78e75')
    .type('form')
    .send({
      cdr: xml
    })
    .end(function(err, response) {
      if (err) console.log(err);
      if (response) {
        console.log(require('util').inspect(response, {depth: 2,colors: true }));
      }
    });
});
//curl -F cdr=@/home/joel/xml_cdr/a513e61c-3759-4502-b3fe-1c8fe4cfbc48.cdr.xml https://ls.com/api/cdr?uuid=a513e61c-3759-4502-b3fe-1c8fe4cfbc48 -k
