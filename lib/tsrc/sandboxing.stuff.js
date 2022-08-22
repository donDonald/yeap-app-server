'use strict';

console.log('typeof global:' + typeof global);
console.log('typeof superDuper:' + typeof superDuper);
console.log('typeof global.superDuper:' + typeof global.superDuper);

if(typeof global !== 'undefined') {
    console.log('global:');
    console.dir(global);
}
const name = 'Some stuff is here';
module.exports = name;
