/**
 * @file test_uri.js
 * @description Tests URI
 * @architecture script
 */

let uri = 'mongodb+srv://jimfleax_db_user:GnklEXzY2JWackIC@codecrusade.q6yjilz.mongodb.net/?appName=codecrusade&compressors=zlib';
if (uri.match(/\/[^/?]+(\?|$)/)) {
  uri = uri.replace(/\/([^/?]+)(\?|$)/, '/$1_test$2');
} else {
  uri = uri.replace(/\/?(\?|$)/, '/test_db$1');
}
console.log(uri);
